import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'] }[] = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/packages', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/experience/find', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/faq', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/auth/login', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/auth/signup', priority: 0.4, changeFrequency: 'yearly' },
  ]

  return entries.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path || '/'}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
