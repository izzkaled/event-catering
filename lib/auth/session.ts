import { normalizePhone } from '@/lib/auth/phone'

const enc = new TextEncoder()

export const USER_SESSION_COOKIE = 'speedy_user_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30

type SessionPayload = {
  v: 1
  uid: string
  role: 'user' | 'admin'
  exp: number
}

function getAuthSecret(): string {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEON_AUTH_COOKIE_SECRET ||
    process.env.ADMIN_SECRET_TOKEN
  if (!secret) throw new Error('AUTH_SECRET is not configured')
  return secret
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return toBase64Url(new Uint8Array(signature))
}

export async function createSessionToken(userId: string, role: 'user' | 'admin'): Promise<string> {
  const payload: SessionPayload = {
    v: 1,
    uid: userId,
    role,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  }
  const encoded = toBase64Url(enc.encode(JSON.stringify(payload)))
  const signature = await sign(encoded)
  return `${encoded}.${signature}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expected = await sign(encoded)
  if (signature.length !== expected.length) return null
  let mismatch = 0
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  if (mismatch !== 0) return null

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as SessionPayload
    if (payload.v !== 1 || !payload.uid || !payload.role || !payload.exp) return null
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export function isAdminPhone(phone: string): boolean {
  const raw = process.env.ADMIN_PHONE?.trim()
  if (!raw) return false
  const adminPhone = normalizePhone(raw) || raw
  return phone === adminPhone
}

export type { SessionPayload }
