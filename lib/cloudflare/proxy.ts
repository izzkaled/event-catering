import { NextResponse } from 'next/server'

/** When TRUST_CLOUDFLARE_PROXY=true, block direct origin access (no CF-Ray header). */
export function requireCloudflareProxy(request: Request): NextResponse | null {
  if (process.env.TRUST_CLOUDFLARE_PROXY !== 'true') return null
  if (process.env.NODE_ENV === 'development') return null

  const cfRay = request.headers.get('cf-ray')?.trim()
  if (!cfRay) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
