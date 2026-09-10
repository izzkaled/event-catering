import { addOneMonth } from '@/lib/constants'

/** One-time event: end date defaults to same day. Kept for compatibility with orders.end_date. */
export function subscriptionEndDate(startDate: string): string {
  return startDate || addOneMonth(startDate)
}

/** For catering: visits_per_week stores guest count — monthly mirror is same value. */
export function visitsPerMonthFromWeekly(guestCount: number): number {
  return Math.max(1, guestCount)
}

/** Event booking needs exactly one event day selected. */
export function isValidPreferredDaysCount(days: string[], _guestCount: number): boolean {
  return days.length === 1
}

export function clampPreferredDays(days: string[], _guestCount: number): string[] {
  return days.slice(0, 1)
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
