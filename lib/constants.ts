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
  'عصر 2-5',
  'مساء 5-8',
] as const

export const PREFERRED_TIMES_EN = [
  'Morning 8-10',
  'Morning 10-12',
  'Noon 12-2',
  'Afternoon 2-5',
  'Evening 5-8',
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
  pending: { ar: 'بانتظار المراجعة', en: 'Pending review' },
  confirmed: { ar: 'تم تأكيد العرض', en: 'Quote confirmed' },
  active: { ar: 'قيد التنفيذ', en: 'In progress' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
  completed: { ar: 'مكتمل', en: 'Completed' },
}

/** Tailwind classes for order status badges */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  confirmed: 'bg-primary/10 text-primary border-primary/25',
  active: 'bg-sky-100 text-sky-900 border-sky-200',
  cancelled: 'bg-rose-100 text-rose-900 border-rose-200',
  completed: 'bg-slate-100 text-slate-800 border-slate-200',
}

export const PAYMENT_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  unpaid: { ar: 'غير مدفوع', en: 'Unpaid' },
  pending_verification: { ar: 'بانتظار التحقق من التحويل', en: 'Pending verification' },
  paid: { ar: 'مدفوع', en: 'Paid' },
  failed: { ar: 'فشل الدفع / مرفوض', en: 'Payment failed' },
  refunded: { ar: 'مسترد', en: 'Refunded' },
  partially_refunded: { ar: 'مسترد جزئياً', en: 'Partially refunded' },
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: 'bg-slate-100 text-slate-800 border-slate-200',
  pending_verification: 'bg-amber-100 text-amber-900 border-amber-200',
  paid: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  failed: 'bg-rose-100 text-rose-900 border-rose-200',
  refunded: 'bg-slate-100 text-slate-700 border-slate-200',
  partially_refunded: 'bg-orange-100 text-orange-900 border-orange-200',
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
