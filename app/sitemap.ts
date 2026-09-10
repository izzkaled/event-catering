import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const paths = [
    '',
    '/packages',
    '/experience/find',
    '/faq',
    '/auth/login',
    '/auth/signup',
    '/subscriptions',
    '/profile',
  ]

  return paths.map((path) => ({
    url: `${SITE_URL}${path || '/'}`,
    lastModified: now,
    changeFrequency: path === '' || path === '/faq' || path === '/packages' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/packages' ? 0.9 : path === '/faq' ? 0.85 : 0.6,
  }))
}
