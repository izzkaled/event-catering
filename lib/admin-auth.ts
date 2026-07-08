import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/get-session-user'

export async function verifyAdmin(): Promise<NextResponse | null> {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
