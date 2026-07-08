import { NextResponse } from 'next/server'
import { timingSafeEqual } from '@/lib/security/timing-safe'

/** Guard server-to-server routes (emails, etc.) with INTERNAL_API_SECRET. */
export function verifyInternalApi(request: Request): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET?.trim()
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      const host = new URL(request.url).hostname
      if (host === 'localhost' || host === '127.0.0.1') return null
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || !timingSafeEqual(token, secret)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export function internalApiHeaders(): Record<string, string> {
  const secret = process.env.INTERNAL_API_SECRET?.trim()
  if (!secret) return { 'Content-Type': 'application/json' }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
  }
}
