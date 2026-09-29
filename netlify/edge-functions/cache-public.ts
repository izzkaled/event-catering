import type { Config, Context } from '@netlify/edge-functions'

/**
 * Next.js on Netlify often emits Cache-Control: private for App Router HTML.
 * Override CDN headers for anonymous public pages so Durable/Edge cache can absorb spikes.
 * HTML is safe to cache: auth state is fetched client-side, not baked into these routes.
 */

const MARKETING = new Set(['/', '/faq'])

function isPublicPath(pathname: string): boolean {
  if (MARKETING.has(pathname)) return true
  if (pathname === '/packages' || pathname === '/experience/find') return true
  // /packages/:slug — not preview
  if (pathname.startsWith('/packages/')) {
    const parts = pathname.split('/').filter(Boolean)
    return parts.length === 2 && parts[0] === 'packages'
  }
  return false
}

export default async (request: Request, context: Context) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return

  const { pathname } = new URL(request.url)
  if (!isPublicPath(pathname)) return

  const response = await context.next()
  if (response.status !== 200) return response

  const sMaxAge = MARKETING.has(pathname) ? 300 : 60
  const swr = MARKETING.has(pathname) ? 86400 : 3600
  const headers = new Headers(response.headers)
  headers.set(
    'Netlify-CDN-Cache-Control',
    `public, durable, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
  )
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  // Avoid cookie variance poisoning the CDN key for these public shells
  headers.delete('Set-Cookie')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export const config: Config = {
  path: ['/', '/faq', '/packages', '/packages/*', '/experience/find'],
  excludedPath: ['/packages/*/preview'],
  method: ['GET', 'HEAD'],
  onError: 'bypass',
}
