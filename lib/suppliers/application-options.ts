export const PREP_SPEED_OPTIONS = [
  { id: 'same_day', ar: 'نفس اليوم', en: 'Same day' },
  { id: 'hours_24', ar: 'خلال 24 ساعة', en: 'Within 24 hours' },
  { id: 'hours_48', ar: 'خلال 48 ساعة', en: 'Within 48 hours' },
  { id: 'days_3', ar: 'خلال 3 أيام', en: 'Within 3 days' },
  { id: 'week_plus', ar: 'أسبوع أو أكثر', en: 'A week or more' },
] as const

export const KITCHEN_TYPE_OPTIONS = [
  { id: 'omani', ar: 'عُماني', en: 'Omani' },
  { id: 'arabic', ar: 'عربي', en: 'Arabic' },
  { id: 'indian', ar: 'هندي', en: 'Indian' },
  { id: 'asian', ar: 'آسيوي', en: 'Asian' },
  { id: 'international', ar: 'عالمي', en: 'International' },
  { id: 'mixed', ar: 'مختلط', en: 'Mixed' },
  { id: 'other', ar: 'أخرى', en: 'Other' },
] as const

export const APPLICATION_STATUS_OPTIONS = [
  { id: 'pending', ar: 'جديد', en: 'Pending' },
  { id: 'reviewed', ar: 'تمت المراجعة', en: 'Reviewed' },
  { id: 'approved', ar: 'مقبول', en: 'Approved' },
  { id: 'rejected', ar: 'مرفوض', en: 'Rejected' },
] as const

export type PrepSpeedId = (typeof PREP_SPEED_OPTIONS)[number]['id']
export type KitchenTypeId = (typeof KITCHEN_TYPE_OPTIONS)[number]['id']
export type ApplicationStatusId = (typeof APPLICATION_STATUS_OPTIONS)[number]['id']

export const PREP_SPEED_IDS = new Set(PREP_SPEED_OPTIONS.map((o) => o.id))
export const KITCHEN_TYPE_IDS = new Set(KITCHEN_TYPE_OPTIONS.map((o) => o.id))
export const APPLICATION_STATUS_IDS = new Set(APPLICATION_STATUS_OPTIONS.map((o) => o.id))

export const MAX_SUPPLIER_PHOTOS = 8

export function labelForOption<T extends { id: string; ar: string; en: string }>(
  options: readonly T[],
  id: string | null | undefined,
  lang: 'ar' | 'en',
): string {
  const hit = options.find((o) => o.id === id)
  if (!hit) return id || '—'
  return lang === 'ar' ? hit.ar : hit.en
}
