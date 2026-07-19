import { addOneMonth } from '@/lib/constants'

/** Monthly subscription ends one calendar month after start. */
export function subscriptionEndDate(startDate: string): string {
  return addOneMonth(startDate)
}

export function visitsPerMonthFromWeekly(visitsPerWeek: number): number {
  return Math.max(1, visitsPerWeek) * 4
}

export function isValidPreferredDaysCount(days: string[], visitsPerWeek: number): boolean {
  return days.length > 0 && days.length === visitsPerWeek
}

export function clampPreferredDays(days: string[], visitsPerWeek: number): string[] {
  return days.slice(0, Math.max(1, visitsPerWeek))
}

export function formatBookingDate(isoDate: string, lang: 'ar' | 'en'): string {
  if (!isoDate) return ''
  try {
    return new Date(`${isoDate}T12:00:00`).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return isoDate
  }
}
