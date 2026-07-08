import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, type User } from '@/lib/db/schema'
import { USER_SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)
  if (!session) return null

  const [user] = await db.select().from(users).where(eq(users.id, session.uid)).limit(1)
  return user ?? null
}

export async function requireUser(): Promise<User | null> {
  return getCurrentUser()
}
