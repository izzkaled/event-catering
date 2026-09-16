import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Crawl rules for Google + AI assistants (ChatGPT, Perplexity, Claude, etc.).
 * Private account/admin/payment flows stay blocked.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    '/admin',
    '/admin/',
    '/api/',
    '/auth/callback',
    '/booking/pending',
    '/booking/success',
    '/booking/failed',
    '/booking/request-received',
    '/profile',
    '/subscriptions',
  ]

  const allowAi = {
    allow: '/' as const,
    disallow: privatePaths,
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      { userAgent: 'Googlebot', ...allowAi },
      { userAgent: 'Google-Extended', ...allowAi },
      { userAgent: 'GPTBot', ...allowAi },
      { userAgent: 'ChatGPT-User', ...allowAi },
      { userAgent: 'OAI-SearchBot', ...allowAi },
      { userAgent: 'PerplexityBot', ...allowAi },
      { userAgent: 'ClaudeBot', ...allowAi },
      { userAgent: 'anthropic-ai', ...allowAi },
      { userAgent: 'Applebot-Extended', ...allowAi },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
