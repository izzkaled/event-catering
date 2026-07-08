import { eq, and, ne, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { normalizePhone } from '@/lib/auth/phone'

/** Normalize to +968XXXXXXXX for users table. */
function canonicalUserPhone(phone: string): string | null {
  const normalized = normalizePhone(phone)
  if (normalized) return normalized
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('968')) return `+${digits}`
  if (digits.length === 8 && /^[79]/.test(digits)) return `+968${digits}`
  return null
}

/** Returns true if another account already owns this phone. */
export async function isPhoneTakenByOther(phone: string, profileId: string): Promise<boolean> {
  const normalized = canonicalUserPhone(phone)
  if (!normalized) return false

  const digits = normalized.replace(/\D/g, '')

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        ne(users.id, profileId),
        sql`replace(${users.phone}, '+', '') = ${digits}`,
      ),
    )
    .limit(1)

  return Boolean(existing)
}

export async function safeSyncProfileFromOrder(
  profileId: string,
  data: {
    name: string
    phone: string
    email: string | null
    area: string
    address: string
  },
) {
  const phoneTaken = await isPhoneTakenByOther(data.phone, profileId)

  await db
    .update(users)
    .set({
      name: data.name,
      email: data.email,
      area: data.area,
      address: data.address,
      ...(phoneTaken ? {} : { phone: canonicalUserPhone(data.phone) }),
      updated_at: new Date(),
    })
    .where(eq(users.id, profileId))
}
