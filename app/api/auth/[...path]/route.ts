import { NextResponse } from 'next/server'
import { auth } from '@/lib/neon-auth'
import { getClientIp } from '@/lib/cloudflare/client-ip'
import {
  assertLoginAllowed,
  assertSignupAllowed,
  clearLoginFailures,
  recordLoginFailure,
  recordSignupAttempt,
} from '@/lib/auth/login-attempts'

const neon = auth.handler()

export const { GET, PUT, DELETE, PATCH } = neon

type NeonRouteCtx = Parameters<typeof neon.POST>[1]

function pathSegments(params: { path?: string[] }): string {
  return (params.path ?? []).join('/')
}

function asNeonCtx(ctx: { params: Promise<{ path?: string[] }> }): NeonRouteCtx {
  return ctx as NeonRouteCtx
}

async function readJsonBody(req: Request): Promise<{ body: unknown; raw: string }> {
  const raw = await req.text()
  let body: unknown = null
  try {
    body = raw ? JSON.parse(raw) : null
  } catch {
    body = null
  }
  return { body, raw }
}

function rebuildRequest(req: Request, raw: string): Request {
  return new Request(req.url, {
    method: req.method,
    headers: req.headers,
    body: raw || undefined,
  })
}

function extractEmail(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const email = (body as { email?: unknown }).email
  if (typeof email !== 'string') return null
  const normalized = email.trim().toLowerCase()
  return normalized.includes('@') ? normalized : null
}

/**
 * Gateway between the client and Neon Auth (replaces a PHP proxy layer).
 * - Login: 5 failed password attempts / 15 min (email + IP)
 * - Signup: rate-limit per IP
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ path?: string[] }> },
) {
  const params = await ctx.params
  const path = pathSegments(params)
  const ip = getClientIp(req)

  // Password sign-in
  if (path === 'sign-in/email' || path === 'signin/email') {
    const { body, raw } = await readJsonBody(req)
    const email = extractEmail(body)
    if (!email) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const allowed = await assertLoginAllowed(ip, email)
    if (!allowed.ok) {
      return NextResponse.json(
        {
          code: 'TOO_MANY_ATTEMPTS',
          message: `Too many failed login attempts. Try again in ${Math.ceil(allowed.retryAfterSec / 60)} minutes.`,
          messageAr: `محاولات كثيرة خاطئة. حاول مرة أخرى بعد ${Math.ceil(allowed.retryAfterSec / 60)} دقيقة.`,
          retryAfterSec: allowed.retryAfterSec,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(allowed.retryAfterSec) },
        },
      )
    }

    const res = await neon.POST(rebuildRequest(req, raw), asNeonCtx(ctx))
    if (res.ok) {
      await clearLoginFailures(ip, email)
      return res
    }

    // Count only credential-like failures (401/400/403), not 5xx
    if (res.status === 401 || res.status === 400 || res.status === 403) {
      const after = await recordLoginFailure(ip, email)
      if (!after.ok) {
        return NextResponse.json(
          {
            code: 'TOO_MANY_ATTEMPTS',
            message: `Too many failed login attempts. Try again in ${Math.ceil(after.retryAfterSec / 60)} minutes.`,
            messageAr: `محاولات كثيرة خاطئة. حاول مرة أخرى بعد ${Math.ceil(after.retryAfterSec / 60)} دقيقة.`,
            retryAfterSec: after.retryAfterSec,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(after.retryAfterSec) },
          },
        )
      }
    }
    return res
  }

  // Sign-up gateway (rate limit instead of a PHP middle layer)
  if (path === 'sign-up/email' || path === 'signup/email') {
    const allowed = await assertSignupAllowed(ip)
    if (!allowed.ok) {
      return NextResponse.json(
        {
          code: 'TOO_MANY_SIGNUPS',
          message: `Too many sign-up attempts. Try again in ${Math.ceil(allowed.retryAfterSec / 60)} minutes.`,
          messageAr: `محاولات تسجيل كثيرة. حاول بعد ${Math.ceil(allowed.retryAfterSec / 60)} دقيقة.`,
          retryAfterSec: allowed.retryAfterSec,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(allowed.retryAfterSec) },
        },
      )
    }

    const { raw } = await readJsonBody(req)
    await recordSignupAttempt(ip)
    return neon.POST(rebuildRequest(req, raw), asNeonCtx(ctx))
  }

  return neon.POST(req, asNeonCtx(ctx))
}
