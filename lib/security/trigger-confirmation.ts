import { internalApiHeaders } from '@/lib/security/internal-api'

type ConfirmationEvent = 'created' | 'confirmed' | 'cancelled'

/** Fire-and-forget order email/PDF — authenticated internal call only. */
export function triggerOrderConfirmation(origin: string, orderId: string, event: ConfirmationEvent) {
  if (!process.env.INTERNAL_API_SECRET?.trim() && process.env.NODE_ENV !== 'development') {
    console.warn('[triggerOrderConfirmation] INTERNAL_API_SECRET not set')
    return
  }

  fetch(`${origin.replace(/\/$/, '')}/api/send-confirmation`, {
    method: 'POST',
    headers: internalApiHeaders(),
    body: JSON.stringify({ orderId, event }),
  }).catch(console.error)
}
