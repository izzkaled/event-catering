const MAX_ATTEMPTS = 5
const WINDOW_MS = 10 * 60 * 1000
const attempts = new Map<string, { count: number; firstAt: number }>()

export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now })
    return true
  }
  entry.count += 1
  return entry.count <= MAX_ATTEMPTS
}

export function clearRateLimit(key: string) {
  attempts.delete(key)
}
