import type { Supplier } from '@/lib/db/schema'

export type SupplierMonthKey = string // YYYY-MM

export type SupplierOrderRow = {
  id: string
  order_number: string
  customer_name: string
  package_name_ar: string | null
  package_name_en: string | null
  status: string
  payment_status: string
  price_omr: string
  commission_omr: string
  net_revenue_omr: string
  created_at: Date | string | null
  start_date: string
}

export type SupplierStats = {
  supplier: Supplier
  month: SupplierMonthKey
  month_label: string
  catalog: {
    packages: number
    services: number
    active_packages: number
  }
  settlement: {
    orders_total: number
    orders_active_pipeline: number
    orders_completed: number
    orders_cancelled: number
    gross_omr: number
    commission_omr: number
    net_omr: number
    paid_omr: number
    unpaid_omr: number
  }
  status_counts: Record<string, number>
  daily_orders: { day: string; orders: number; revenue: number }[]
  recent_orders: SupplierOrderRow[]
}

export type SupplierListItem = Supplier & {
  packages_count: number
  services_count: number
  month_orders: number
  month_cancelled: number
  month_gross_omr: number
  month_paid_omr: number
}

export function currentMonthKey(d = new Date()): SupplierMonthKey {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(month: SupplierMonthKey, lang: 'ar' | 'en' = 'ar') {
  const [y, m] = month.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  return date.toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  })
}
