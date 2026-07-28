import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const paths = [
    '',
    '/booking',
    '/faq',
    '/auth/login',
    '/auth/signup',
    '/subscriptions',
    '/profile',
  ]

  return paths.map((path) => ({
    url: `${SITE_URL}${path || '/'}`,
    lastModified: now,
    changeFrequency: path === '' || path === '/faq' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/booking' ? 0.9 : path === '/faq' ? 0.85 : 0.6,
  }))
}
