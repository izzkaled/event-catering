import { NextResponse } from 'next/server'
import { and, desc, eq, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { otpCodes, users } from '@/lib/db/schema'
import { normalizePhone } from '@/lib/auth/phone'
import { OTP_MAX_ATTEMPTS, verifyOtpCode } from '@/lib/auth/otp'
import {
  SESSION_MAX_AGE,
  USER_SESSION_COOKIE,
  createSessionToken,
} from '@/lib/auth/session'
import { isAdminPhone } from '@/lib/auth/admin'
import { checkOtpSms, usesTwilioVerify } from '@/lib/auth/sms'
import { checkRateLimit, clearRateLimit, getClientIp } from '@/lib/auth/rate-limit'
import { requireTurnstile } from '@/lib/cloudflare/turnstile'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  if (!(await checkRateLimit(`phone-verify:${ip}`))) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const body = (await req.json().catch(() => null)) as {
    phone?: string
    code?: string
    mode?: 'login' | 'signup'
    name?: string
    turnstileToken?: string
  } | null

  const turnstileDenied = await requireTurnstile(req, body?.turnstileToken)
  if (turnstileDenied) return turnstileDenied

  const phone = normalizePhone(body?.phone || '')
  const code = body?.code?.trim()
  if (!phone) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }
  if (!code) {
    return NextResponse.json({ error: 'OTP code is required' }, { status: 400 })
  }

  try {
    if (usesTwilioVerify()) {
      const approved = await checkOtpSms(phone, code)
      if (!approved) {
        return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 401 })
      }
    } else {
      const [latestOtp] = await db
        .select()
        .from(otpCodes)
        .where(and(eq(otpCodes.phone, phone), gt(otpCodes.expires_at, new Date())))
        .orderBy(desc(otpCodes.created_at))
        .limit(1)

      if (!latestOtp) {
        return NextResponse.json({ error: 'OTP expired or not found' }, { status: 401 })
      }

      if (latestOtp.attempts >= OTP_MAX_ATTEMPTS) {
        return NextResponse.json({ error: 'Too many invalid attempts' }, { status: 429 })
      }

      if (!verifyOtpCode(code, latestOtp.code_hash)) {
        await db
          .update(otpCodes)
          .set({ attempts: latestOtp.attempts + 1 })
          .where(eq(otpCodes.id, latestOtp.id))
        return NextResponse.json({ error: 'Invalid OTP code' }, { status: 401 })
      }

      await db.delete(otpCodes).where(eq(otpCodes.id, latestOtp.id))
    }
  } catch (e) {
    console.error('[phone verify-otp]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'OTP verification failed' },
      { status: 500 },
    )
  }

  const role = isAdminPhone(phone) ? 'admin' : 'user'
  const providedName = body?.name?.trim()
  const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1)

  let user = existing
  if (!user) {
    ;[user] = await db
      .insert(users)
      .values({
        phone,
        name: providedName || `User ${phone.slice(-4)}`,
        role,
      })
      .returning()
  } else {
    ;[user] = await db
      .update(users)
      .set({
        ...(providedName ? { name: providedName } : {}),
        role,
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning()
  }

  // Keep verify rate limits — only clear send-for-phone so a verified user can request a new code later if needed.
  await clearRateLimit(`phone-send:${phone}`)

  const token = await createSessionToken(user.id, user.role as 'user' | 'admin')
  const res = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      profileId: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
      area: user.area,
      address: user.address,
      source: 'phone',
    },
  })

  res.cookies.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  return res
}
