import { WEEK_DAYS_AR, WEEK_DAYS_EN } from '@/lib/constants'

/**
 * Catering field mapping (legacy column names kept for DB compatibility):
 * - hours_per_visit  → service duration hours
 * - visits_per_week  → guest count (عدد الأشخاص)
 * - visits_per_month → guest capacity mirror (same as guests for one-time events)
 */
export function guestCount(pkg: { visits_per_week: number }) {
  return pkg.visits_per_week
}

export function serviceHours(pkg: { hours_per_visit: number }) {
  return pkg.hours_per_visit
}

export function formatGuests(n: number, lang: 'ar' | 'en') {
  if (lang === 'ar') return `${n} شخص`
  return n === 1 ? '1 guest' : `${n} guests`
}

export function formatServiceHours(n: number, lang: 'ar' | 'en') {
  if (lang === 'ar') return `${n} ساعة خدمة`
  return n === 1 ? '1 service hour' : `${n} service hours`
}

export const GUEST_PRESETS = [25, 50, 75, 100, 150, 200, 300] as const

/** Arabic weekday for DB (must match WEEK_DAYS_AR). */
export function weekdayArFromIsoDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  const jsDay = d.getDay() // 0=Sun … 6=Sat
  // WEEK_DAYS_AR starts Saturday
  const index = jsDay === 6 ? 0 : jsDay + 1
  return WEEK_DAYS_AR[index]
}

export function weekdayFromIsoDate(isoDate: string, lang: 'ar' | 'en'): string {
  const ar = weekdayArFromIsoDate(isoDate)
  if (lang === 'ar') return ar
  const idx = WEEK_DAYS_AR.indexOf(ar as (typeof WEEK_DAYS_AR)[number])
  return idx >= 0 ? WEEK_DAYS_EN[idx] : ar
}
