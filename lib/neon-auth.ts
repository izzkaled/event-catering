import { createNeonAuth } from '@neondatabase/auth/next/server'

const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET?.trim()
const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim()

if (!cookieSecret || cookieSecret.length < 32) {
  throw new Error(
    'Missing NEON_AUTH_COOKIE_SECRET (min 32 chars). Copy .env.example → .env.local and set it, then restart `next dev`.',
  )
}

if (!baseUrl) {
  throw new Error(
    'Missing NEON_AUTH_BASE_URL. Copy .env.example → .env.local and set it, then restart `next dev`.',
  )
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    sameSite: 'lax',
  },
})
