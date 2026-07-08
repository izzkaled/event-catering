import { NextResponse } from 'next/server'
import { timingSafeEqual } from '@/lib/security/timing-safe'

/** Verify Neon Auth webhook using shared secret header. */
export function verifyNeonAuthWebhook(request: Request): NextResponse | null {
  const secret = process.env.NEON_AUTH_WEBHOOK_SECRET?.trim()
  if (!secret) {
    if (process.env.NODE_ENV === 'development') return null
    console.error('[webhook] NEON_AUTH_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const provided =
    request.headers.get('x-webhook-secret')?.trim() ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    ''

  if (!provided || !timingSafeEqual(provided, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
