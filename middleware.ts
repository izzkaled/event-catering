import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/neon-auth'
import { USER_SESSION_COOKIE } from '@/lib/auth/session'

const neonMiddleware = auth.middleware({ loginUrl: '/auth/login' })

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hasOAuthVerifier = searchParams.has('neon_auth_session_verifier')
  const hasPhoneSession = Boolean(request.cookies.get(USER_SESSION_COOKIE)?.value)

  // Complete Google OAuth session exchange
  if (hasOAuthVerifier || pathname.startsWith('/auth/callback')) {
    return neonMiddleware(request)
  }

  // Phone OTP session is enough for profile / subscriptions / admin shell
  if (
    hasPhoneSession &&
    (pathname.startsWith('/profile') ||
      pathname.startsWith('/subscriptions') ||
      pathname.startsWith('/admin'))
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/profile') || pathname.startsWith('/subscriptions')) {
    return neonMiddleware(request)
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
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
    '/auth/callback',
    '/auth/login',
    '/auth/signup',
  ],
}
