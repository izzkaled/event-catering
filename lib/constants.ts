export const MUSCAT_AREAS = [
  'مسقط القديمة',
  'مطرح',
  'بوشر',
  'العامرات',
  'السيب',
  'قريات',
] as const

export const MUSCAT_AREAS_EN = [
  'Old Muscat',
  'Mutrah',
  'Bausher',
  'Al Amerat',
  'Seeb',
  'Quriyat',
] as const

export const PREFERRED_TIMES = [
  'صباح 8-10',
  'صباح 10-12',
  'ظهر 12-2',
  'عصر 2-4',
] as const

export const PREFERRED_TIMES_EN = [
  'Morning 8-10',
  'Morning 10-12',
  'Noon 12-2',
  'Afternoon 2-4',
] as const

export const WEEK_DAYS_AR = [
  'السبت',
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
] as const

export const WEEK_DAYS_EN = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
] as const

export const ORDER_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'بانتظار التأكيد', en: 'Pending confirmation' },
  confirmed: { ar: 'تم تأكيد الاشتراك', en: 'Subscription confirmed' },
  active: { ar: 'اشتراك نشط', en: 'Active subscription' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
  completed: { ar: 'منتهي', en: 'Completed' },
}

/** Tailwind classes for subscription/order status badges */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  active: 'bg-sky-100 text-sky-900 border-sky-200',
  cancelled: 'bg-rose-100 text-rose-900 border-rose-200',
  completed: 'bg-slate-100 text-slate-800 border-slate-200',
}

export function addOneMonth(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

export const COMMISSION_RATE = 0.15

export function calcCommission(price: number) {
  return Math.round(price * COMMISSION_RATE * 100) / 100
}

export function calcNetRevenue(price: number) {
  return Math.round(price * (1 - COMMISSION_RATE) * 100) / 100
}

export const OMAN_PHONE_REGEX = /^(968)?(9|7|2)\d{7}$/

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('968')) return digits
  return `968${digits}`
}

export function formatPhoneDisplay(phone: string): string {
  const n = normalizePhone(phone)
  return `+${n}`
}
