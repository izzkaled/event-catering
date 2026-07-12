import { Redis } from '@upstash/redis'

/** Failed password login attempts: 5 tries → lock 15 minutes (email + IP). */
export const LOGIN_MAX_ATTEMPTS = 5
export const LOGIN_LOCK_MS = 15 * 60 * 1000

type AttemptState = { count: number; firstAt: number }

const memory = new Map<string, AttemptState>()

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  return new Redis({ url, token })
}

function memoryGet(key: string): AttemptState | null {
  const entry = memory.get(key)
  if (!entry) return null
  if (Date.now() - entry.firstAt > LOGIN_LOCK_MS) {
    memory.delete(key)
    return null
  }
  return entry
}

async function redisGet(key: string): Promise<AttemptState | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get<AttemptState>(`login-fail:${key}`)
    if (!raw || typeof raw !== 'object') return null
    if (Date.now() - raw.firstAt > LOGIN_LOCK_MS) {
      await redis.del(`login-fail:${key}`)
      return null
    }
    return raw
  } catch (e) {
    console.error('[login-attempts] redis get', e)
    return null
  }
}

async function redisSet(key: string, state: AttemptState): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const ttlSec = Math.ceil(LOGIN_LOCK_MS / 1000)
    await redis.set(`login-fail:${key}`, state, { ex: ttlSec })
  } catch (e) {
    console.error('[login-attempts] redis set', e)
  }
}

async function redisDel(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(`login-fail:${key}`)
  } catch (e) {
    console.error('[login-attempts] redis del', e)
  }
}

async function readState(key: string): Promise<AttemptState | null> {
  const fromRedis = await redisGet(key)
  if (fromRedis) return fromRedis
  return memoryGet(key)
}

async function writeState(key: string, state: AttemptState): Promise<void> {
  memory.set(key, state)
  await redisSet(key, state)
}

export type LoginGuardResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number; remaining: 0 }

function lockedResult(state: AttemptState): LoginGuardResult {
  const elapsed = Date.now() - state.firstAt
  const retryAfterSec = Math.max(1, Math.ceil((LOGIN_LOCK_MS - elapsed) / 1000))
  return { ok: false, retryAfterSec, remaining: 0 }
}

/** Block if either IP or email bucket is already locked (≥ 5 failures in window). */
export async function assertLoginAllowed(ip: string, email: string): Promise<LoginGuardResult> {
  const emailKey = `email:${email.trim().toLowerCase()}`
  const ipKey = `ip:${ip}`

  for (const key of [emailKey, ipKey]) {
    const state = await readState(key)
    if (state && state.count >= LOGIN_MAX_ATTEMPTS) {
      return lockedResult(state)
    }
  }
  return { ok: true }
}

export async function recordLoginFailure(ip: string, email: string): Promise<LoginGuardResult> {
  const keys = [`email:${email.trim().toLowerCase()}`, `ip:${ip}`]
  let worst: LoginGuardResult = { ok: true }

  for (const key of keys) {
    const existing = await readState(key)
    const next: AttemptState = existing
      ? { count: existing.count + 1, firstAt: existing.firstAt }
      : { count: 1, firstAt: Date.now() }
    await writeState(key, next)
    if (next.count >= LOGIN_MAX_ATTEMPTS) {
      worst = lockedResult(next)
    }
  }
  return worst
}

export async function clearLoginFailures(ip: string, email: string): Promise<void> {
  const keys = [`email:${email.trim().toLowerCase()}`, `ip:${ip}`]
  for (const key of keys) {
    memory.delete(key)
    await redisDel(key)
  }
}

/** Signup / auth gateway: softer limit to slow abuse (per IP). */
export async function assertSignupAllowed(ip: string): Promise<LoginGuardResult> {
  const key = `signup-ip:${ip}`
  const state = await readState(key)
  // Reuse same storage shape; allow 8 signups per 15m per IP
  const SIGNUP_MAX = 8
  if (state && state.count >= SIGNUP_MAX) {
    return lockedResult(state)
  }
  return { ok: true }
}

export async function recordSignupAttempt(ip: string): Promise<void> {
  const key = `signup-ip:${ip}`
  const existing = await readState(key)
  const next: AttemptState = existing
    ? { count: existing.count + 1, firstAt: existing.firstAt }
    : { count: 1, firstAt: Date.now() }
  await writeState(key, next)
}
