export const COOKIE_NAME = 'speedy_admin_session'

// Fixed payload signed with the admin secret. Storing the HMAC (not the raw
// secret) means a leaked cookie never exposes ADMIN_SECRET_TOKEN itself.
const SESSION_PAYLOAD = 'speedy-admin-session-v1'

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Computes the signed session token from the admin secret using Web Crypto,
 * which is available in both the Edge (middleware) and Node.js (route) runtimes.
 */
export async function computeSessionToken(secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(SESSION_PAYLOAD))
  return toHex(signature)
}

/** Constant-time string comparison to avoid timing attacks. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export const SESSION_MAX_AGE = 60 * 60 * 24
