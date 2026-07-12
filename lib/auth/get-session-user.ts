import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/neon-auth'
import { db } from '@/lib/db'
import { users, type User } from '@/lib/db/schema'
import { isAdminUser } from '@/lib/auth/admin'
import { USER_SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'
import { normalizePhone } from '@/lib/auth/phone'

export type SessionUser = {
  id: string
  profileId: string
  phone: string | null
  name: string | null
  email: string | null
  role: string
  area: string | null
  address: string | null
  source: 'neon' | 'phone'
}

export async function getSessionUser(): Promise<SessionUser | null> {
  // 1) Neon Auth (Google)
  try {
    const { data: session } = await auth.getSession()
    const neonUser = session?.user as
      | {
          id?: string
          name?: string | null
          email?: string | null
          phoneNumber?: string | null
          role?: string | null
        }
      | undefined

    if (neonUser?.id) {
      const phone = neonUser.phoneNumber
        ? normalizePhone(neonUser.phoneNumber) || neonUser.phoneNumber
        : null

      // Each Neon login maps to ONE profile via auth_user_id (no phone/email merge).
      let [profile] = await db
        .select()
        .from(users)
        .where(eq(users.auth_user_id, neonUser.id))
        .limit(1)

      // Allowlist only — recompute every request so demotions take effect.
      const role = isAdminUser({
        email: neonUser.email,
        phoneNumber: neonUser.phoneNumber,
      })
        ? 'admin'
        : 'user'

      if (!profile) {
        ;[profile] = await db
          .insert(users)
          .values({
            auth_user_id: neonUser.id,
            phone,
            name: neonUser.name ?? null,
            email: neonUser.email ?? null,
            role,
          })
          .returning()
      } else if (
        profile.role !== role ||
        (neonUser.name && neonUser.name !== profile.name) ||
        (neonUser.email && neonUser.email !== profile.email)
      ) {
        ;[profile] = await db
          .update(users)
          .set({
            name: neonUser.name ?? profile.name,
            email: neonUser.email ?? profile.email,
            role,
            updated_at: new Date(),
          })
          .where(eq(users.id, profile.id))
          .returning()
      }

      return {
        id: neonUser.id,
        profileId: profile.id,
        phone: profile.phone,
        name: profile.name,
        email: profile.email,
        role,
        area: profile.area,
        address: profile.address,
        source: 'neon',
      }
    }
  } catch {
    // fall through to phone session
  }

  // 2) Phone OTP session cookie
  const cookieStore = await cookies()
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value
  const payload = await verifySessionToken(token)
  if (!payload) return null

  const [user] = await db.select().from(users).where(eq(users.id, payload.uid)).limit(1)
  if (!user) return null

  return toSessionUser(user, 'phone')
}

function toSessionUser(user: User, source: 'neon' | 'phone'): SessionUser {
  const role = isAdminUser({ email: user.email, phone: user.phone }) ? 'admin' : 'user'
  return {
    id: user.id,
    profileId: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    role,
    area: user.area,
    address: user.address,
    source,
  }
}
