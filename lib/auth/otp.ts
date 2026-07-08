import { createHash, randomInt, timingSafeEqual } from 'crypto'

export const OTP_LENGTH = 6
export const OTP_TTL_MS = 5 * 60 * 1000
export const OTP_MAX_ATTEMPTS = 5

export function generateOtpCode(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0')
}

export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function verifyOtpCode(code: string, codeHash: string): boolean {
  const digest = hashOtp(code)
  if (digest.length !== codeHash.length) return false
  return timingSafeEqual(Buffer.from(digest), Buffer.from(codeHash))
}
