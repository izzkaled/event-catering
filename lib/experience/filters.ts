import type {
  BudgetBand,
  ExperiencePackage,
  GuestBand,
  OccasionType,
  PackageFilter,
} from '@/lib/experience/types'

export const PACKAGE_FILTERS: { id: PackageFilter; ar: string; en: string }[] = [
  { id: 'all', ar: 'جميع الباقات', en: 'All packages' },
  { id: 'private', ar: 'مناسبات خاصة', en: 'Private occasions' },
  { id: 'corporate', ar: 'شركات', en: 'Corporate' },
  { id: 'government', ar: 'جهات حكومية', en: 'Government' },
  { id: 'meeting', ar: 'اجتماعات', en: 'Meetings' },
  { id: 'celebration', ar: 'حفلات', en: 'Celebrations' },
  { id: 'events', ar: 'فعاليات', en: 'Events' },
  { id: 'large', ar: 'مناسبات كبيرة', en: 'Large occasions' },
]

export const GUEST_BANDS: { id: GuestBand; ar: string; en: string; min: number; max: number }[] = [
  { id: '1_20', ar: '1–20', en: '1–20', min: 1, max: 20 },
  { id: '21_50', ar: '21–50', en: '21–50', min: 21, max: 50 },
  { id: '51_100', ar: '51–100', en: '51–100', min: 51, max: 100 },
  { id: '101_250', ar: '101–250', en: '101–250', min: 101, max: 250 },
  { id: '250_plus', ar: '250+', en: '250+', min: 251, max: 9999 },
]

export const BUDGET_BANDS: { id: BudgetBand; ar: string; en: string; min: number; max: number }[] = [
  { id: 'under_100', ar: 'أقل من 100 ر.ع', en: 'Under 100 OMR', min: 0, max: 99 },
  { id: '100_250', ar: '100–250 ر.ع', en: '100–250 OMR', min: 100, max: 250 },
  { id: '250_500', ar: '250–500 ر.ع', en: '250–500 OMR', min: 250, max: 500 },
  { id: '500_1000', ar: '500–1,000 ر.ع', en: '500–1,000 OMR', min: 500, max: 1000 },
  { id: '1000_plus', ar: '1,000+ ر.ع', en: '1,000+ OMR', min: 1000, max: 999999 },
]

export const OCCASION_OPTIONS: { id: OccasionType; ar: string; en: string }[] = [
  { id: 'wedding', ar: 'زفاف', en: 'Wedding' },
  { id: 'corporate', ar: 'فعالية شركات', en: 'Corporate Event' },
  { id: 'government', ar: 'فعالية حكومية', en: 'Government Event' },
  { id: 'private', ar: 'تجمّع خاص', en: 'Private Gathering' },
  { id: 'meeting', ar: 'اجتماع', en: 'Meeting' },
  { id: 'celebration', ar: 'احتفال', en: 'Celebration' },
  { id: 'other', ar: 'أخرى', en: 'Other' },
]

export function filterPackages(
  packages: ExperiencePackage[],
  filter: PackageFilter,
  guestBand: GuestBand | null,
) {
  return packages.filter((pkg) => {
    const byFilter =
      filter === 'all' ||
      pkg.category === filter ||
      pkg.occasion_types.includes(filter as OccasionType) ||
      (filter === 'celebration' && pkg.occasion_types.includes('celebration')) ||
      (filter === 'large' && (pkg.category === 'large' || pkg.max_guests >= 150))

    if (!byFilter) return false
    if (!guestBand) return true
    const band = GUEST_BANDS.find((b) => b.id === guestBand)
    if (!band) return true
    return pkg.min_guests <= band.max && pkg.max_guests >= band.min
  })
}

export function budgetMax(band: BudgetBand | null) {
  if (!band) return null
  return BUDGET_BANDS.find((b) => b.id === band)?.max ?? null
}
