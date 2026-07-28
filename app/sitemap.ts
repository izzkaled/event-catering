import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const paths = [
    '',
    '/booking',
    '/auth/login',
    '/auth/signup',
    '/subscriptions',
    '/profile',
  ]

  return paths.map((path) => ({
    url: `${SITE_URL}${path || '/'}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/booking' ? 0.9 : 0.6,
  }))
}
