import { NextResponse } from 'next/server'
import { sendOtpSms } from '@/lib/auth/sms'
import { sendOtpEmail } from '@/lib/email/send-otp-email'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit'
import { verifyNeonAuthWebhook } from '@/lib/security/verify-webhook'

export const dynamic = 'force-dynamic'

type WebhookPayload = {
  event_type?: string
  event_data?: {
    otp_code?: string
    otp_type?: string
    delivery_preference?: string
    phone_number?: string
  }
  user?: {
    phone_number?: string
    email?: string
    name?: string
  }
  context?: {
    project_name?: string
  }
}

function extractPhone(payload: WebhookPayload): string | null {
  return payload.user?.phone_number || payload.event_data?.phone_number || null
}

/**
 * Neon Auth webhook.
 * IMPORTANT: when `send.otp` is subscribed, Neon skips its shared email provider.
 * This handler must deliver email OTPs (Resend) and optional phone OTPs (Twilio).
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

  // Non-OTP events: acknowledge so Neon continues.
  if (payload.event_type !== 'send.otp') {
    return NextResponse.json({ ok: true })
  }

  const code = payload.event_data?.otp_code?.trim()
  if (!code) {
    return NextResponse.json({ error: 'Missing otp_code' }, { status: 400 })
  }

  const phone = extractPhone(payload)
  const email = payload.user?.email?.trim().toLowerCase()
  const preferSms = payload.event_data?.delivery_preference === 'sms'
  const appName = payload.context?.project_name?.trim() || 'Speedy Cleaning'

  try {
    // Phone OTP (Neon Phone plugin)
    if (preferSms || (phone && !email)) {
      if (!phone) {
        return NextResponse.json({ error: 'Missing phone' }, { status: 400 })
      }
      const result = await sendOtpSms(phone, code)
      console.info('[neon-auth webhook] SMS OTP sent', { phone, provider: result.provider })
      return NextResponse.json({ ok: true, channel: 'sms', provider: result.provider })
    }

    // Email OTP (sign-up / email verification)
    if (email) {
      await sendOtpEmail(email, code, appName)
      console.info('[neon-auth webhook] Email OTP sent', { email })
      return NextResponse.json({ ok: true, channel: 'email', provider: 'resend' })
    }

    return NextResponse.json({ error: 'Missing email or phone for OTP delivery' }, { status: 400 })
  } catch (e) {
    console.error('[neon-auth webhook]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'OTP delivery failed' },
      { status: 500 },
    )
  }
}
