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

/**
 * Reject bots on public forms.
 * Production fails closed if Turnstile keys are missing,
 * unless ALLOW_MISSING_TURNSTILE=true (temporary escape hatch).
 */
export async function requireTurnstile(
  request: Request,
  token: string | undefined | null,
): Promise<NextResponse | null> {
  if (!isTurnstileEnabled()) {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_MISSING_TURNSTILE?.trim() !== 'true'
    ) {
      console.error('[turnstile] CLOUDFLARE_TURNSTILE_* keys not set — blocking request')
      return NextResponse.json(
        { error: 'Bot protection is not configured. Please try again later.' },
        { status: 503 },
      )
    }
    if (process.env.NODE_ENV === 'production') {
      console.warn('[turnstile] ALLOW_MISSING_TURNSTILE=true — requests allowed without Turnstile')
    }
    return null
  }

  const ok = await verifyTurnstileToken(token, request)
  if (!ok) {
    return NextResponse.json({ error: 'Security verification failed. Please try again.' }, { status: 403 })
  }
  return null
}
