import type { PackageWithSection } from '@/lib/packages/types'
import { PACKAGE_ENRICHMENT, normalizePackageKey } from '@/lib/experience/catalog'
import type { ExperiencePackage, PackageEnrichment, PackageFilter } from '@/lib/experience/types'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function defaultEnrichment(pkg: PackageWithSection): PackageEnrichment {
  const guests = pkg.visits_per_week
  const section = pkg.section_slug || 'corporate'
  const category: PackageFilter =
    section === 'official' ? 'government' : section === 'openings' ? 'private' : section === 'corporate' ? 'corporate' : 'events'

  return {
    slug: slugify(pkg.name_en || pkg.name_ar || pkg.id),
    description_ar: 'تجربة ضيافة قابلة للتخصيص تناسب مناسبتك.',
    description_en: 'A customizable hospitality experience designed around your occasion.',
    category,
    occasion_types: category === 'government' ? ['government', 'meeting'] : category === 'corporate' ? ['corporate', 'meeting'] : ['private', 'celebration'],
    min_guests: Math.max(10, Math.round(guests * 0.6)),
    max_guests: Math.max(guests, Math.round(guests * 1.4)),
    per_guest_omr: Math.max(1.5, Number(pkg.price_omr) / Math.max(guests, 1) / 2),
    features_ar: ['مشروبات ترحيب', 'قهوة عربية', 'تمور', 'طاقم تقديم', 'تجهيز'],
    features_en: ['Welcome drinks', 'Arabic coffee', 'Dates', 'Service staff', 'Setup'],
    included_service_ids: ['arabic-coffee', 'dates', 'tea', 'servers'],
    recommended_service_ids: ['welcome-area', 'water'],
    cover_image: '/images/brand/brand-table.webp',
    gallery: ['/images/brand/brand-table.webp', '/images/brand/brand-uniform.webp'],
  }
}

export function enrichPackage(pkg: PackageWithSection): ExperiencePackage {
  const key = normalizePackageKey(pkg.name_en)
  const enrichment = PACKAGE_ENRICHMENT[key] || defaultEnrichment(pkg)

  return {
    ...pkg,
    ...enrichment,
    is_recommended: Boolean(enrichment.is_recommended || pkg.is_popular),
    base_price: Number.parseFloat(String(pkg.price_omr)) || 0,
  }
}

export function enrichPackages(packages: PackageWithSection[]): ExperiencePackage[] {
  return packages.map(enrichPackage)
}

export function findPackageBySlug(packages: PackageWithSection[], slug: string) {
  return enrichPackages(packages).find((p) => p.slug === slug) || null
}
