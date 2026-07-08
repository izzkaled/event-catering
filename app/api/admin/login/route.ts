import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Admin login now uses phone OTP at /admin/login' },
    { status: 410 },
  )
}
