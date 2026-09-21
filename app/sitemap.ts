import type { MetadataRoute } from 'next'
import { FALLBACK_PACKAGES } from '@/lib/packages/fallback'
import { SITE_URL } from '@/lib/seo'

/** Cache sitemap so crawlers rarely hit a cold DB path (avoids intermittent 500s). */
export const revalidate = 3600

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function packageEntry(
  slug: string | null | undefined,
  nameEn: string,
  now: Date,
): MetadataRoute.Sitemap[number] | null {
  const safe = (slug || slugify(nameEn) || '').trim()
  if (!safe) return null
  return {
    url: `${SITE_URL}/packages/${safe}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }
}

function fallbackPackageEntries(now: Date): MetadataRoute.Sitemap {
  return FALLBACK_PACKAGES.map((pkg) => packageEntry(pkg.slug, pkg.name_en, now)).filter(
    (entry): entry is MetadataRoute.Sitemap[number] => entry !== null,
  )
}

async function loadPackageEntries(now: Date): Promise<MetadataRoute.Sitemap> {
  const fallback = () => fallbackPackageEntries(now)

  try {
    const timedOut = new Promise<'timeout'>((resolve) => {
      setTimeout(() => resolve('timeout'), 2500)
    })

    const load = (async () => {
      const { getPublishedPackagesWithSections } = await import('@/lib/packages/queries')
      return getPublishedPackagesWithSections()
    })()

    const result = await Promise.race([load, timedOut])
    if (result === 'timeout' || !Array.isArray(result) || result.length === 0) {
      return fallback()
    }

    const entries = result
      .map((pkg) => packageEntry(pkg.slug, pkg.name_en, now))
      .filter((entry): entry is MetadataRoute.Sitemap[number] => entry !== null)

    return entries.length ? entries : fallback()
  } catch {
    return fallback()
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Public marketing URLs only — auth pages add crawl noise without ranking value
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/packages`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${SITE_URL}/experience/find`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/experience`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
  ]

  try {
    const packageEntries = await loadPackageEntries(now)
    return [...staticEntries, ...packageEntries]
  } catch {
    // Absolute last resort — static URLs must always succeed for Google
    return [...staticEntries, ...fallbackPackageEntries(now)]
  }
}
