import { NextResponse } from 'next/server'
import { getClientIp } from '@/lib/cloudflare/client-ip'

export function isTurnstileEnabled(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY?.trim(),
  )
}

export async function verifyTurnstileToken(
  token: string | undefined | null,
  request: Request,
): Promise<boolean> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim()
  if (!secret) {
    return process.env.NODE_ENV === 'development'
  }
  if (!token?.trim()) return false

  const form = new URLSearchParams()
  form.set('secret', secret)
  form.set('response', token.trim())
  const ip = getClientIp(request)
  if (ip !== 'unknown') form.set('remoteip', ip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}

/** Reject bots on public forms when Turnstile is configured. */
export async function requireTurnstile(
  request: Request,
  token: string | undefined | null,
): Promise<NextResponse | null> {
  if (!isTurnstileEnabled()) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[turnstile] CLOUDFLARE_TURNSTILE_* keys not set in production')
    }
    return null
  }

  const ok = await verifyTurnstileToken(token, request)
  if (!ok) {
    return NextResponse.json({ error: 'Security verification failed. Please try again.' }, { status: 403 })
  }
  return null
}
