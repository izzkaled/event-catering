import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/get-session-user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json({ ok: true, role: user.role })
}
