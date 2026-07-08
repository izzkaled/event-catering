export const AUTH_RETURN_TO_KEY = 'returnTo'
export const AUTH_CHECKOUT_DRAFT_KEY = 'checkoutDraft'
export const AUTH_PHONE_KEY = 'authPhone'
export const AUTH_EMAIL_KEY = 'authEmail'
export const AUTH_MODE_KEY = 'authMode'
export const AUTH_NAME_KEY = 'authName'

export function saveReturnTo(path?: string) {
  if (typeof window === 'undefined') return
  const value = path || `${window.location.pathname}${window.location.search}`
  sessionStorage.setItem(AUTH_RETURN_TO_KEY, value)
}

export function getReturnTo(fallback = '/booking'): string {
  if (typeof window === 'undefined') return fallback
  return sessionStorage.getItem(AUTH_RETURN_TO_KEY) || fallback
}

export function clearReturnTo() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AUTH_RETURN_TO_KEY)
}

export function saveCheckoutDraft<T>(draft: T) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(AUTH_CHECKOUT_DRAFT_KEY, JSON.stringify(draft))
}

export function getCheckoutDraft<T>(): T | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(AUTH_CHECKOUT_DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function clearCheckoutDraft() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AUTH_CHECKOUT_DRAFT_KEY)
}

export function saveAuthPhone(phone: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(AUTH_PHONE_KEY, phone)
}

export function getAuthPhone(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(AUTH_PHONE_KEY)
}

export function clearAuthPhone() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AUTH_PHONE_KEY)
}

export function saveAuthEmail(email: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(AUTH_EMAIL_KEY, email.trim().toLowerCase())
}

export function getAuthEmail(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(AUTH_EMAIL_KEY)
}

export function clearAuthEmail() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AUTH_EMAIL_KEY)
}

export function saveAuthMode(mode: 'login' | 'signup') {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(AUTH_MODE_KEY, mode)
}

export function getAuthMode(): 'login' | 'signup' {
  if (typeof window === 'undefined') return 'login'
  return sessionStorage.getItem(AUTH_MODE_KEY) === 'signup' ? 'signup' : 'login'
}

export function saveAuthName(name: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(AUTH_NAME_KEY, name)
}

export function getAuthName(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(AUTH_NAME_KEY)
}

export function clearAuthSessionKeys() {
  clearAuthPhone()
  clearAuthEmail()
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AUTH_MODE_KEY)
  sessionStorage.removeItem(AUTH_NAME_KEY)
}
