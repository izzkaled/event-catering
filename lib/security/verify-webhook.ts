import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { timingSafeEqual } from '@/lib/security/timing-safe'

type JwkKey = crypto.JsonWebKey & { kid?: string }

let jwksCache: { keys: JwkKey[]; fetchedAt: number } | null = null
const JWKS_TTL_MS = 10 * 60 * 1000

async function fetchJwks(): Promise<JwkKey[]> {
  const now = Date.now()
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys
  }

  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim().replace(/\/$/, '')
  if (!baseUrl) {
    throw new Error('NEON_AUTH_BASE_URL is required for webhook verification')
  }

  const res = await fetch(`${baseUrl}/.well-known/jwks.json`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to fetch JWKS (${res.status})`)
  }

  const jwks = (await res.json()) as { keys?: JwkKey[] }
  const keys = jwks.keys ?? []
  jwksCache = { keys, fetchedAt: now }
  return keys
}

/** Verify Neon Auth webhook EdDSA (Ed25519) detached JWS signature. */
async function verifyNeonSignature(rawBody: string, headers: Headers): Promise<void> {
  const signature = headers.get('x-neon-signature')
  const kid = headers.get('x-neon-signature-kid')
  const timestamp = headers.get('x-neon-timestamp')

  if (!signature || !kid || !timestamp) {
    throw new Error('Missing Neon webhook signature headers')
  }

  const keys = await fetchJwks()
  let jwk = keys.find((k) => k.kid === kid)
  if (!jwk) {
    jwksCache = null
    const refreshed = await fetchJwks()
    jwk = refreshed.find((k) => k.kid === kid)
  }
  if (!jwk) {
    throw new Error(`JWKS key ${kid} not found`)
  }

  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' })

  const parts = signature.split('.')
  if (parts.length !== 3 || parts[1] !== '') {
    throw new Error('Expected detached JWS format')
  }
  const [headerB64, , signatureB64] = parts

  const payloadB64 = Buffer.from(rawBody, 'utf8').toString('base64url')
  const signaturePayload = `${timestamp}.${payloadB64}`
  const signaturePayloadB64 = Buffer.from(signaturePayload, 'utf8').toString('base64url')
  const signingInput = `${headerB64}.${signaturePayloadB64}`

  const isValid = crypto.verify(
    null,
    Buffer.from(signingInput),
    publicKey,
    Buffer.from(signatureB64, 'base64url'),
  )
  if (!isValid) {
    throw new Error('Invalid Neon webhook signature')
  }

  const ageMs = Date.now() - Number.parseInt(timestamp, 10)
  if (!Number.isFinite(ageMs) || ageMs > 5 * 60 * 1000 || ageMs < -60_000) {
    throw new Error('Webhook timestamp outside allowed window')
  }
}

function verifySharedSecret(request: Request): boolean {
  const secret = process.env.NEON_AUTH_WEBHOOK_SECRET?.trim()
  if (!secret) return false

  const provided =
    request.headers.get('x-webhook-secret')?.trim() ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    ''

  return Boolean(provided && timingSafeEqual(provided, secret))
}

/**
 * Verify Neon Auth webhook requests.
 * Neon sends EdDSA signatures (X-Neon-Signature). Optional x-webhook-secret is
 * supported for manual curl tests only.
 */
export async function verifyNeonAuthWebhook(
  request: Request,
  rawBody: string,
): Promise<NextResponse | null> {
  if (request.headers.get('x-neon-signature')) {
    try {
      await verifyNeonSignature(rawBody, request.headers)
      return null
    } catch (e) {
      console.error('[webhook] Neon signature verification failed:', e)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (verifySharedSecret(request)) {
    return null
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn('[webhook] No Neon signature or shared secret — allowed in development only')
    return null
  }

  console.error('[webhook] Missing Neon signature headers')
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
