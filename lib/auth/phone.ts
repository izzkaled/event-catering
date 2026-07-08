const OMAN_MOBILE = /^\+968[79]\d{7}$/

export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (!digits) return null

  let normalized: string
  if (digits.startsWith('968') && digits.length === 11) {
    normalized = `+${digits}`
  } else if (digits.length === 8 && /^[79]/.test(digits)) {
    normalized = `+968${digits}`
  } else {
    return null
  }

  return OMAN_MOBILE.test(normalized) ? normalized : null
}

export function formatPhoneDisplay(phone: string): string {
  if (!phone.startsWith('+968') || phone.length !== 12) return phone
  return `${phone.slice(0, 4)} ${phone.slice(4)}`
}
