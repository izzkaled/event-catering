import type { PackageWithSection } from '@/lib/packages/types'

export type OccasionType =
  | 'wedding'
  | 'corporate'
  | 'government'
  | 'private'
  | 'meeting'
  | 'celebration'
  | 'events'
  | 'large'
  | 'other'

export type VenueType = 'indoor' | 'outdoor' | 'venue'

export type ServiceCategory = 'food_beverage' | 'setup' | 'staff' | 'additional'

export type BudgetBand = 'under_100' | '100_250' | '250_500' | '500_1000' | '1000_plus'

export type PackageFilter =
  | 'all'
  | 'private'
  | 'corporate'
  | 'government'
  | 'meeting'
  | 'celebration'
  | 'events'
  | 'large'

export type GuestBand = '1_20' | '21_50' | '51_100' | '101_250' | '250_plus'

export type CatalogService = {
  id: string
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  category: ServiceCategory
  /** Unit price: flat fee OR per-guest rate depending on pricing_model */
  price_omr: number
  /** fixed = one fee; per_guest = price_omr × guests */
  pricing_model?: 'fixed' | 'per_guest'
  image?: string | null
}

export type PackageEnrichment = {
  slug: string
  description_ar: string
  description_en: string
  category: PackageFilter
  occasion_types: OccasionType[]
  min_guests: number
  max_guests: number
  per_guest_omr: number
  features_ar: string[]
  features_en: string[]
  included_service_ids: string[]
  recommended_service_ids: string[]
  cover_image: string
  gallery: string[]
  is_recommended?: boolean
  badge_ar?: string
  badge_en?: string
}

export type ExperiencePackage = Omit<
  PackageWithSection,
  | 'per_guest_omr'
  | 'slug'
  | 'description_ar'
  | 'description_en'
  | 'occasion_types'
  | 'min_guests'
  | 'max_guests'
  | 'features_ar'
  | 'features_en'
  | 'cover_image'
  | 'gallery'
  | 'is_recommended'
> & {
  slug: string
  description_ar: string
  description_en: string
  category: PackageFilter
  occasion_types: OccasionType[]
  min_guests: number
  max_guests: number
  per_guest_omr: number
  features_ar: string[]
  features_en: string[]
  included_service_ids: string[]
  recommended_service_ids: string[]
  cover_image: string
  gallery: string[]
  is_recommended: boolean
  badge_ar?: string
  badge_en?: string
  base_price: number
}

export type ExperienceDraft = {
  id: string
  packageId: string
  packageSlug: string
  occasion: OccasionType | null
  guests: number
  date: string
  time: string
  location: string
  venueType: VenueType | null
  budget: BudgetBand | null
  selectedServiceIds: string[]
  updatedAt: string
}

export type PriceBreakdown = {
  packageBase: number
  guestsExtra: number
  services: number
  setup: number
  staff: number
  location: number
  estimatedTotal: number
}
