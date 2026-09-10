import type { PackageWithSection } from '@/lib/packages/types'
import { enrichPackage as enrichFromCatalog } from '@/lib/experience/enrich'
import type { ExperiencePackage } from '@/lib/experience/types'
import type { HospitalityService } from '@/lib/db/schema'

export type PackageServiceLink = {
  id: string
  role: string
  included: boolean
  quantity: number
  custom_price_omr: string | null
  sort_order: number
  service: HospitalityService
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** Map a DB/fallback package (+ optional service links) to storefront ExperiencePackage. */
export function toExperiencePackage(
  pkg: PackageWithSection,
  services: PackageServiceLink[] = [],
): ExperiencePackage {
  const base = enrichFromCatalog(pkg)
  const included = services.filter((s) => s.role === 'included' || s.included)
  const recommended = services.filter((s) => s.role === 'recommended')
  const optional = services.filter((s) => s.role === 'optional' || s.role === 'addon')

  const minGuests = pkg.min_guests ?? base.min_guests
  const maxGuests = pkg.max_guests ?? base.max_guests
  const occasions = (
    pkg.occasion_types?.length ? pkg.occasion_types : base.occasion_types
  ) as ExperiencePackage['occasion_types']

  const features_ar = pkg.features_ar?.length
    ? pkg.features_ar
    : included.map((s) => s.service.name_ar).slice(0, 6)
  const features_en = pkg.features_en?.length
    ? pkg.features_en
    : included.map((s) => s.service.name_en).slice(0, 6)

  return {
    ...base,
    ...pkg,
    slug: pkg.slug || base.slug || slugify(pkg.name_en),
    description_ar: pkg.short_description_ar || pkg.description_ar || base.description_ar,
    description_en: pkg.short_description_en || pkg.description_en || base.description_en,
    occasion_types: occasions,
    category: (occasions[0] as ExperiencePackage['category']) || base.category,
    min_guests: minGuests,
    max_guests: maxGuests,
    per_guest_omr: pkg.per_guest_omr != null ? Number(pkg.per_guest_omr) : base.per_guest_omr,
    features_ar: features_ar.length ? features_ar : base.features_ar,
    features_en: features_en.length ? features_en : base.features_en,
    included_service_ids: included.length
      ? included.map((s) => s.service.slug)
      : base.included_service_ids,
    recommended_service_ids: recommended.length
      ? recommended.map((s) => s.service.slug)
      : optional
          .slice(0, 3)
          .map((s) => s.service.slug)
          .concat(base.recommended_service_ids)
          .slice(0, 4),
    cover_image: pkg.cover_image || base.cover_image,
    gallery: pkg.gallery?.length ? pkg.gallery : base.gallery,
    is_recommended: Boolean(pkg.is_recommended || pkg.is_popular || base.is_recommended),
    badge_ar: pkg.is_popular
      ? 'الأكثر اختيارًا'
      : pkg.is_recommended
        ? 'موصى بها'
        : pkg.is_best_value
          ? 'أفضل قيمة'
          : pkg.is_new
            ? 'جديدة'
            : base.badge_ar,
    badge_en: pkg.is_popular
      ? 'Most Popular'
      : pkg.is_recommended
        ? 'Recommended'
        : pkg.is_best_value
          ? 'Best Value'
          : pkg.is_new
            ? 'New'
            : base.badge_en,
    base_price: Number.parseFloat(String(pkg.price_omr)) || 0,
  }
}
