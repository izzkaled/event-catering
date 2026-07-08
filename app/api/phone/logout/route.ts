import { NextResponse } from 'next/server'
import { USER_SESSION_COOKIE } from '@/lib/auth/session'

export async function POST() {
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
