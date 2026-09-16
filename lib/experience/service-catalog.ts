import type { HospitalityService } from '@/lib/db/schema'
import type { CatalogService, ServiceCategory } from '@/lib/experience/types'
import { CATALOG_SERVICES } from '@/lib/experience/catalog'

const CATEGORIES: ServiceCategory[] = ['food_beverage', 'setup', 'staff', 'additional']

export function mapDbServiceToCatalog(row: HospitalityService): CatalogService {
  const category = CATEGORIES.includes(row.category as ServiceCategory)
    ? (row.category as ServiceCategory)
    : 'additional'
  return {
    id: row.slug,
    name_ar: row.name_ar,
    name_en: row.name_en,
    description_ar: row.description_ar || '',
    description_en: row.description_en || '',
    category,
    price_omr: Number.parseFloat(String(row.price_omr)) || 0,
    pricing_model: row.pricing_model === 'per_guest' ? 'per_guest' : 'fixed',
    image: row.image_url,
  }
}

/** Prefer DB services when available; otherwise static catalog. */
export function resolveServicesCatalog(dbRows: HospitalityService[] | null | undefined): CatalogService[] {
  const active = (dbRows || []).filter((r) => r.is_active && !r.is_archived)
  if (active.length) return active.map(mapDbServiceToCatalog)
  return CATALOG_SERVICES.map((s) => ({ ...s, pricing_model: s.pricing_model || 'fixed' }))
}
