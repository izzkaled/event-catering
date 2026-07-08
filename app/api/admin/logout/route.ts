import { NextResponse } from 'next/server'
import { auth } from '@/lib/neon-auth'
import { USER_SESSION_COOKIE } from '@/lib/auth/session'

export async function POST() {
  await auth.signOut()

  const res = NextResponse.json({ success: true })
  res.cookies.set(USER_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return res
}
