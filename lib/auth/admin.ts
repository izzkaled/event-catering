import { normalizePhone } from '@/lib/auth/phone'

type AuthUser = {
  role?: string | null
  phoneNumber?: string | null
  email?: string | null
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

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  if (user.phoneNumber) {
    const phone = normalizePhone(user.phoneNumber) || user.phoneNumber
    if (isAdminPhone(phone)) return true
  }
  if (user.email && isAdminEmail(user.email)) return true
  return false
}
