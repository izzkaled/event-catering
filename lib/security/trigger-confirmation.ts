import { internalApiHeaders } from '@/lib/security/internal-api'

type ConfirmationEvent = 'created' | 'confirmed' | 'cancelled'

/**
 * Absolute app origin for server-to-server calls.
 * Never derive from request Host — that can exfiltrate INTERNAL_API_SECRET.
 */
export function getAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.INTERNAL_APP_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000'
  throw new Error('NEXT_PUBLIC_SITE_URL (or INTERNAL_APP_URL) is required in production')
}

/** Fire-and-forget order email/PDF — authenticated internal call only. */
export function triggerOrderConfirmation(orderId: string, event: ConfirmationEvent, origin?: string) {
  if (!process.env.INTERNAL_API_SECRET?.trim() && process.env.NODE_ENV !== 'development') {
    console.warn('[triggerOrderConfirmation] INTERNAL_API_SECRET not set')
    return
  }

  let base: string
  try {
    base = (origin?.trim() || getAppOrigin()).replace(/\/$/, '')
  } catch (e) {
    console.error('[triggerOrderConfirmation]', e)
    return
  }

  // Reject non-http(s) origins to avoid accidental SSRF
  if (!/^https?:\/\//i.test(base)) {
    console.error('[triggerOrderConfirmation] Invalid origin:', base)
    return
  }

  fetch(`${base}/api/send-confirmation`, {
    method: 'POST',
    headers: internalApiHeaders(),
    body: JSON.stringify({ orderId, event }),
  }).catch(console.error)
}
