import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit'
import { verifyNeonAuthWebhook } from '@/lib/security/verify-webhook'

export const dynamic = 'force-dynamic'

type WebhookPayload = {
  event_type?: string
}

/**
 * Neon Auth webhook receiver (optional / non-OTP events only).
 *
 * OTP delivery is Neon built-in email (`auth@mail.myneon.app`).
 * If `send.otp` is enabled on this webhook, Neon SKIPS its own mailer —
 * so we refuse send.otp and tell operators to disable that event.
 *
 * Configure: `npm run setup:neon-otp` (disables send.otp webhook).
 */
export async function POST(req: Request) {
  const rawBody = await req.text()

  const denied = await verifyNeonAuthWebhook(req, rawBody)
  if (denied) return denied

  const ip = getClientIp(req)
  if (!(await checkRateLimit(`neon-webhook:${ip}`))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let payload: WebhookPayload | null = null
  try {
    payload = JSON.parse(rawBody) as WebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload?.event_type) {
    return NextResponse.json({ error: 'Missing event_type' }, { status: 400 })
  }

  if (payload.event_type === 'send.otp') {
    console.error(
      '[neon-auth webhook] send.otp received — Neon native OTP is required. Disable send.otp webhook (npm run setup:neon-otp).',
    )
    return NextResponse.json(
      {
        error:
          'OTP must be delivered by Neon Auth shared email. Disable the send.otp webhook in Neon Console (or run npm run setup:neon-otp).',
      },
      { status: 501 },
    )
  }

  return NextResponse.json({ ok: true })
}
