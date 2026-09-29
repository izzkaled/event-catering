import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getClientIp } from '@/lib/cloudflare/client-ip'

export { getClientIp }

/** Named budgets for public vs sensitive APIs under load. */
export type RateLimitPolicy = 'auth' | 'write' | 'chat' | 'soft' | 'webhook'

type PolicyConfig = {
  max: number
  /** Upstash sliding-window duration string */
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`
  windowMs: number
  prefix: string
}

const POLICIES: Record<RateLimitPolicy, PolicyConfig> = {
  /** OTP / verify / credential abuse */
  auth: { max: 5, window: '10 m', windowMs: 10 * 60 * 1000, prefix: 'ec-rl-auth' },
  /** Orders, payments, bank uploads, confirmations */
  write: { max: 20, window: '10 m', windowMs: 10 * 60 * 1000, prefix: 'ec-rl-write' },
  /** AI chat */
  chat: { max: 30, window: '10 m', windowMs: 10 * 60 * 1000, prefix: 'ec-rl-chat' },
  /** Beacons / public GETs */
  soft: { max: 120, window: '1 m', windowMs: 60 * 1000, prefix: 'ec-rl-soft' },
  /** Signed webhooks */
  webhook: { max: 60, window: '1 m', windowMs: 60 * 1000, prefix: 'ec-rl-hook' },
}

const memoryAttempts = new Map<string, { count: number; firstAt: number }>()
const upstashLimiters = new Map<RateLimitPolicy, Ratelimit | null>()

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  return new Redis({ url, token })
}

function getUpstashLimiter(policy: RateLimitPolicy): Ratelimit | null {
  if (upstashLimiters.has(policy)) return upstashLimiters.get(policy) ?? null

  const redis = getRedis()
  if (!redis) {
    upstashLimiters.set(policy, null)
    return null
  }

  const cfg = POLICIES[policy]
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.max, cfg.window),
    prefix: cfg.prefix,
    analytics: true,
  })
  upstashLimiters.set(policy, limiter)
  return limiter
}

function checkMemoryRateLimit(key: string, policy: RateLimitPolicy): boolean {
  const cfg = POLICIES[policy]
  const mapKey = `${policy}:${key}`
  const now = Date.now()
  const entry = memoryAttempts.get(mapKey)
  if (!entry || now - entry.firstAt > cfg.windowMs) {
    memoryAttempts.set(mapKey, { count: 1, firstAt: now })
    return true
  }
  entry.count += 1
  return entry.count <= cfg.max
}

/** Preferred API — pick a policy that matches the endpoint cost/risk. */
export async function limitRequest(key: string, policy: RateLimitPolicy = 'auth'): Promise<boolean> {
  const limiter = getUpstashLimiter(policy)
  if (limiter) {
    try {
      const { success } = await limiter.limit(key)
      return success
    } catch (e) {
      console.error(`[rate-limit] Upstash ${policy} error, falling back to memory:`, e)
    }
  }
  return checkMemoryRateLimit(key, policy)
}

/** @deprecated Prefer `limitRequest(key, policy)`. Defaults to strict auth budget. */
export async function checkRateLimit(key: string): Promise<boolean> {
  return limitRequest(key, 'auth')
}

/** Soft per-IP budget for cheap public beacons (e.g. package view). */
export async function checkSoftRateLimit(
  key: string,
  _opts?: { max: number; windowMs: number },
): Promise<boolean> {
  return limitRequest(key, 'soft')
}

export async function clearRateLimit(key: string): Promise<void> {
  for (const policy of Object.keys(POLICIES) as RateLimitPolicy[]) {
    memoryAttempts.delete(`${policy}:${key}`)
  }
  memoryAttempts.delete(key)
  memoryAttempts.delete(`soft:${key}`)
}
