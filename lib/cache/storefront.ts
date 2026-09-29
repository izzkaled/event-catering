import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import {
  getActiveCategories,
  getExperiencePackageBySlug,
  getExperiencePackages,
  getPublishedPackagesWithSections,
} from '@/lib/packages/storefront'

/** Shared CDN / ISR window for public catalog pages (seconds). */
export const STOREFRONT_REVALIDATE_SECONDS = 60

/** Longer window for mostly-static marketing pages. */
export const MARKETING_REVALIDATE_SECONDS = 300

export const PACKAGES_CACHE_TAG = 'packages'
export const CATEGORIES_CACHE_TAG = 'package-categories'

export const getPublishedPackagesCached = unstable_cache(
  async () => getPublishedPackagesWithSections(),
  ['storefront-published-packages'],
  { revalidate: STOREFRONT_REVALIDATE_SECONDS, tags: [PACKAGES_CACHE_TAG] },
)

export const getExperiencePackagesCached = unstable_cache(
  async () => getExperiencePackages(),
  ['storefront-experience-packages'],
  { revalidate: STOREFRONT_REVALIDATE_SECONDS, tags: [PACKAGES_CACHE_TAG] },
)

export const getActiveCategoriesCached = unstable_cache(
  async () => getActiveCategories(),
  ['storefront-active-categories'],
  { revalidate: STOREFRONT_REVALIDATE_SECONDS, tags: [CATEGORIES_CACHE_TAG, PACKAGES_CACHE_TAG] },
)

export function getPublishedPackageBySlugCached(slug: string) {
  return unstable_cache(
    async () => getExperiencePackageBySlug(slug, { preview: false }),
    ['storefront-package-by-slug', slug],
    { revalidate: STOREFRONT_REVALIDATE_SECONDS, tags: [PACKAGES_CACHE_TAG, `package:${slug}`] },
  )()
}

/** Bust Next.js ISR + tagged data caches after admin catalog edits. */
export function revalidateStorefront(opts?: { slug?: string | null }) {
  revalidateTag(PACKAGES_CACHE_TAG, 'max')
  revalidateTag(CATEGORIES_CACHE_TAG, 'max')
  revalidatePath('/')
  revalidatePath('/packages')
  revalidatePath('/experience/find')
  revalidatePath('/faq')
  if (opts?.slug) {
    revalidateTag(`package:${opts.slug}`, 'max')
    revalidatePath(`/packages/${opts.slug}`)
    revalidatePath(`/packages/${opts.slug}/preview`)
  } else {
    revalidatePath('/packages', 'layout')
  }
}
