import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/neon-auth'
import { USER_SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'
import { requireCloudflareProxy } from '@/lib/cloudflare/proxy'

const neonMiddleware = auth.middleware({ loginUrl: '/auth/login' })

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hasOAuthVerifier = searchParams.has('neon_auth_session_verifier')
  const phoneToken = request.cookies.get(USER_SESSION_COOKIE)?.value
  const phoneSession = phoneToken ? await verifySessionToken(phoneToken) : null

  if (
    process.env.TRUST_CLOUDFLARE_PROXY === 'true' &&
    (pathname.startsWith('/api/admin') || pathname.startsWith('/admin'))
  ) {
    const blocked = requireCloudflareProxy(request)
    if (blocked) return blocked
  }

  if (pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  if (hasOAuthVerifier || pathname.startsWith('/auth/callback')) {
    return neonMiddleware(request)
  }

  if (pathname.startsWith('/profile') || pathname.startsWith('/subscriptions')) {
    if (phoneSession) return NextResponse.next()
    return neonMiddleware(request)
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // Require a session only — allowlist role is enforced in dashboard layout + APIs
    if (phoneSession) return NextResponse.next()
    return neonMiddleware(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/profile',
    '/profile/:path*',
    '/subscriptions',
    '/subscriptions/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/auth/callback',
    '/auth/login',
    '/auth/signup',
  ],
}
