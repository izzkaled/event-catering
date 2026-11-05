import { normalizePhone } from '@/lib/auth/phone'

type AuthUser = {
  role?: string | null
  phoneNumber?: string | null
  email?: string | null
  phone?: string | null
}

/** Split ADMIN_EMAIL / ADMIN_PHONE allowlists: comma, semicolon, or whitespace. */
function parseAllowlist(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function getAdminEmails(): string[] {
  return [
    ...new Set(parseAllowlist(process.env.ADMIN_EMAIL).map((email) => email.toLowerCase())),
  ]
}

export function getAdminPhones(): string[] {
  return [
    ...new Set(
      parseAllowlist(process.env.ADMIN_PHONE).map((phone) => normalizePhone(phone) || phone),
    ),
  ]
}

export function isAdminPhone(phone: string): boolean {
  const normalized = normalizePhone(phone) || phone
  return getAdminPhones().includes(normalized)
}

export function isAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return false
  return getAdminEmails().includes(normalized)
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
