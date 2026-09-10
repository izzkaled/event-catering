import {
  MUSCAT_AREAS,
  PREFERRED_TIMES,
  WEEK_DAYS_AR,
  calcCommission,
  calcNetRevenue,
} from '@/lib/constants'
import type { Package } from '@/lib/db/schema'

const MAX_NAME = 120
const MAX_ADDRESS = 500
const MAX_NOTES = 1000
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export type ValidatedOrderInput = {
  customer_name: string
  customer_phone: string
  customer_email: string | null
  customer_address: string
  customer_area: string
  notes: string | null
  package_id: string
  hours_per_visit: number
  visits_per_week: number
  visits_per_month: number
  price_omr: string
  commission_omr: string
  net_revenue_omr: string
  start_date: string
  end_date: string
  preferred_time: string
  preferred_days: string[]
}

export function clampText(value: string, max: number): string {
  return value.trim().slice(0, max)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export function validateOrderPayload(
  body: Record<string, unknown>,
  pkg: Package | undefined,
): { ok: true; data: ValidatedOrderInput } | { ok: false; error: string } {
  if (!pkg || !pkg.is_active) {
    return { ok: false, error: 'Invalid or inactive package' }
  }

  const customer_name = clampText(String(body.customer_name ?? ''), MAX_NAME)
  const customer_phone = String(body.customer_phone ?? '').trim()
  const customer_address = clampText(String(body.customer_address ?? ''), MAX_ADDRESS)
  const customer_area = String(body.customer_area ?? '').trim()
  const rawEmail = body.customer_email ? String(body.customer_email).trim().toLowerCase() : ''
  const notes = body.notes ? clampText(String(body.notes), MAX_NOTES) : null
  const start_date = String(body.start_date ?? '').trim()
  const preferred_time = String(body.preferred_time ?? '').trim()
  const preferred_days = Array.isArray(body.preferred_days)
    ? body.preferred_days.map((d) => String(d).trim()).filter(Boolean)
    : []

  if (!customer_name || !customer_phone || !customer_address || !customer_area || !start_date) {
    return { ok: false, error: 'Missing required fields' }
  }
  if (!MUSCAT_AREAS.includes(customer_area as (typeof MUSCAT_AREAS)[number])) {
    return { ok: false, error: 'Invalid service area' }
  }
  if (!ISO_DATE.test(start_date)) {
    return { ok: false, error: 'Invalid start date' }
  }
  const today = new Date().toISOString().slice(0, 10)
  if (start_date < today) {
    return { ok: false, error: 'Start date must be today or later' }
  }
  if (!PREFERRED_TIMES.includes(preferred_time as (typeof PREFERRED_TIMES)[number])) {
    return { ok: false, error: 'Invalid preferred time' }
  }
  if (!preferred_days.length) {
    return { ok: false, error: 'Select the event day' }
  }
  // Catering: one event day (visits_per_week stores guest count, not days)
  if (preferred_days.length !== 1) {
    return {
      ok: false,
      error: 'Select exactly 1 event day',
    }
  }
  if (!preferred_days.every((d) => WEEK_DAYS_AR.includes(d as (typeof WEEK_DAYS_AR)[number]))) {
    return { ok: false, error: 'Invalid preferred days' }
  }
  if (rawEmail && !isValidEmail(rawEmail)) {
    return { ok: false, error: 'Invalid email address' }
  }

  const price = parseFloat(String(pkg.price_omr))
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, error: 'Invalid package price' }
  }

  return {
    ok: true,
    data: {
      customer_name,
      customer_phone,
      customer_email: rawEmail || null,
      customer_address,
      customer_area,
      notes,
      package_id: pkg.id,
      hours_per_visit: pkg.hours_per_visit,
      visits_per_week: pkg.visits_per_week,
      visits_per_month: pkg.visits_per_month,
      price_omr: price.toFixed(2),
      commission_omr: calcCommission(price).toFixed(2),
      net_revenue_omr: calcNetRevenue(price).toFixed(2),
      start_date,
      end_date: start_date,
      preferred_time,
      preferred_days,
    },
  }
}
