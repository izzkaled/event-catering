import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getClientIp } from '@/lib/cloudflare/client-ip'

export { getClientIp }

const MAX_ATTEMPTS = 5
const WINDOW_MS = 10 * 60 * 1000

const memoryAttempts = new Map<string, { count: number; firstAt: number }>()

let upstashLimiter: Ratelimit | null | undefined

function getUpstashLimiter(): Ratelimit | null {
  if (upstashLimiter !== undefined) return upstashLimiter

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) {
    upstashLimiter = null
    return null
  }

  const redis = new Redis({ url, token })
  upstashLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_ATTEMPTS, '10 m'),
    prefix: 'speedy-rl',
    analytics: true,
  })
  return upstashLimiter
}

function checkMemoryRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = memoryAttempts.get(key)
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    memoryAttempts.set(key, { count: 1, firstAt: now })
    return true
  }
  entry.count += 1
  return entry.count <= MAX_ATTEMPTS
}

export async function checkRateLimit(key: string): Promise<boolean> {
  const limiter = getUpstashLimiter()
  if (limiter) {
    try {
      const { success } = await limiter.limit(key)
      return success
    } catch (e) {
      console.error('[rate-limit] Upstash error, falling back to memory:', e)
    }
  }
  return checkMemoryRateLimit(key)
}

export async function clearRateLimit(key: string): Promise<void> {
  memoryAttempts.delete(key)
}
