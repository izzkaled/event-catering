/** Real client IP — prefers Cloudflare when proxied. */
export function getClientIp(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf

  const trueClient = req.headers.get('true-client-ip')?.trim()
  if (trueClient) return trueClient

  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()

  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}
