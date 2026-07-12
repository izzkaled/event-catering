import { normalizePhone } from '@/lib/auth/phone'

type AuthUser = {
  role?: string | null
  phoneNumber?: string | null
  email?: string | null
  phone?: string | null
}

export function isAdminPhone(phone: string): boolean {
  const raw = process.env.ADMIN_PHONE?.trim()
  if (!raw) return false
  const adminPhone = normalizePhone(raw) || raw
  return phone === adminPhone
}

export function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return email.trim().toLowerCase() === adminEmail
}

/**
 * Admin is granted only via ADMIN_EMAIL / ADMIN_PHONE env allowlist.
 * Do not trust Neon session `role` or a sticky DB role alone.
 */
export function isAdminUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (user.email && isAdminEmail(user.email)) return true
  const phoneRaw = user.phoneNumber || user.phone
  if (phoneRaw) {
    const phone = normalizePhone(phoneRaw) || phoneRaw
    if (isAdminPhone(phone)) return true
  }
  return false
}

/** Recompute role from allowlist on every login / session resolve. */
export function resolveUserRole(user: AuthUser | null | undefined): 'admin' | 'user' {
  return isAdminUser(user) ? 'admin' : 'user'
}

