import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { sendOtpSms } from '@/lib/auth/sms'

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

async function sendOtpEmail(to: string, code: string, appName: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required to deliver email OTP')
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    'Speedy Cleaning <onboarding@resend.dev>'

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${appName}: verification code ${code}`,
    html: `
      <div style="font-family:sans-serif;line-height:1.5">
        <h2>${appName}</h2>
        <p>Your verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:0.2em">${code}</p>
        <p>This code expires in 15 minutes.</p>
      </div>
    `,
    text: `${appName} verification code: ${code}\nThis code expires in 15 minutes.`,
  })

  if (error) {
    throw new Error(error.message || 'Failed to send email via Resend')
  }
}

/**
 * Neon Auth webhook.
 * IMPORTANT: when `send.otp` is subscribed, Neon skips its shared email provider.
 * This handler must deliver email OTPs (Resend) and optional phone OTPs (Twilio).
 */
export async function POST(req: Request) {
  const rawBody = await req.text()
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
