import type { MetadataRoute } from 'next'
import { FALLBACK_PACKAGES } from '@/lib/packages/fallback'
import { SITE_URL } from '@/lib/seo'

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/packages`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${SITE_URL}/experience/find`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/experience`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${SITE_URL}/auth/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/auth/signup`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  let packageEntries: MetadataRoute.Sitemap = []
  try {
    const { getPublishedPackagesWithSections } = await import('@/lib/packages/queries')
    const packages = await getPublishedPackagesWithSections()
    packageEntries = packages.map((pkg) => {
      const slug = pkg.slug || slugify(pkg.name_en)
      return {
        url: `${SITE_URL}/packages/${slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    })
  } catch {
    packageEntries = FALLBACK_PACKAGES.map((pkg) => ({
      url: `${SITE_URL}/packages/${pkg.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  }

  return [...staticEntries, ...packageEntries]
}
