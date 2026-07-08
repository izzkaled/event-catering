import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { otpCodes } from '@/lib/db/schema'
import { normalizePhone } from '@/lib/auth/phone'
import { generateOtpCode, hashOtp, OTP_TTL_MS } from '@/lib/auth/otp'
import { sendOtpSms, usesTwilioVerify } from '@/lib/auth/sms'
import { checkRateLimit, clearRateLimit, getClientIp } from '@/lib/auth/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  if (!checkRateLimit(`phone-send:${ip}`)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const body = (await req.json().catch(() => null)) as { phone?: string } | null
  const phone = normalizePhone(body?.phone || '')
  if (!phone) {
    return NextResponse.json(
      { error: 'Invalid Oman mobile. Use 8 digits starting with 7 or 9 (+968).' },
      { status: 400 },
    )
  }

  if (!checkRateLimit(`phone-send:${phone}`)) {
    return NextResponse.json({ error: 'Too many attempts for this number.' }, { status: 429 })
  }

  try {
    if (usesTwilioVerify()) {
      // Twilio generates and SMS-delivers the code to the user's phone
      const result = await sendOtpSms(phone)
      clearRateLimit(`phone-send:${ip}`)
      console.info(`[phone OTP] SMS sent via Twilio Verify to ${phone}`)
      return NextResponse.json({
        success: true,
        phone,
        channel: result.channel,
        provider: result.provider,
        expiresIn: OTP_TTL_MS / 1000,
      })
    }

    // Messages API path: we generate the code and SMS it
    const code = generateOtpCode()
    await db.insert(otpCodes).values({
      phone,
      code_hash: hashOtp(code),
      expires_at: new Date(Date.now() + OTP_TTL_MS),
      attempts: 0,
    })

    const result = await sendOtpSms(phone, code)
    clearRateLimit(`phone-send:${ip}`)
    console.info(`[phone OTP] SMS sent via Messages API to ${phone}`)

    return NextResponse.json({
      success: true,
      phone,
      channel: result.channel,
      provider: result.provider,
      expiresIn: OTP_TTL_MS / 1000,
    })
  } catch (e) {
    console.error('[phone send-otp]', e)
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : 'Failed to send SMS. Check Twilio credentials and Verify service.',
      },
      { status: 500 },
    )
  }
}
