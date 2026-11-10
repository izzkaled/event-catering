import { and, asc, count, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  hospitalityServices,
  orders,
  packages,
  suppliers,
  type Order,
} from '@/lib/db/schema'
import {
  currentMonthKey,
  monthLabel,
  type SupplierListItem,
  type SupplierMonthKey,
  type SupplierOrderRow,
  type SupplierStats,
} from '@/lib/admin/supplier-stats-shared'

export type {
  SupplierListItem,
  SupplierMonthKey,
  SupplierOrderRow,
  SupplierStats,
} from '@/lib/admin/supplier-stats-shared'
export { currentMonthKey, monthLabel } from '@/lib/admin/supplier-stats-shared'

function monthBounds(month: SupplierMonthKey) {
  const [y, m] = month.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0))
  return { start, end }
}

function toOrderRow(o: Order): SupplierOrderRow {
  return {
    id: o.id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    package_name_ar: o.package_name_ar,
    package_name_en: o.package_name_en,
    status: o.status,
    payment_status: o.payment_status,
    price_omr: o.price_omr,
    commission_omr: o.commission_omr,
    net_revenue_omr: o.net_revenue_omr,
    created_at: o.created_at,
    start_date: o.start_date,
  }
}

export async function getSupplierStats(
  supplierId: string,
  month: SupplierMonthKey = currentMonthKey(),
): Promise<SupplierStats | null> {
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1)
  if (!supplier) return null

  const { start, end } = monthBounds(month)

  const [[pkgCount], [activePkg], [svcCount]] = await Promise.all([
    db.select({ n: count() }).from(packages).where(eq(packages.supplier_id, supplierId)),
    db
      .select({ n: count() })
      .from(packages)
      .where(
        and(
          eq(packages.supplier_id, supplierId),
          eq(packages.is_active, true),
          eq(packages.status, 'published'),
        ),
      ),
    db
      .select({ n: count() })
      .from(hospitalityServices)
      .where(
        and(
          eq(hospitalityServices.supplier_id, supplierId),
          eq(hospitalityServices.is_archived, false),
        ),
      ),
  ])

  const monthOrders = await db
    .select({ order: orders })
    .from(orders)
    .innerJoin(packages, eq(orders.package_id, packages.id))
    .where(
      and(
        eq(packages.supplier_id, supplierId),
        gte(orders.created_at, start),
        lt(orders.created_at, end),
      ),
    )
    .orderBy(desc(orders.created_at))

  const list = monthOrders.map((r) => r.order)
  const status_counts: Record<string, number> = {}
  let gross = 0
  let commission = 0
  let net = 0
  let paid = 0
  let unpaid = 0
  let cancelled = 0
  let completed = 0
  let pipeline = 0

  const dailyMap = new Map<string, { orders: number; revenue: number }>()

  for (const o of list) {
    status_counts[o.status] = (status_counts[o.status] || 0) + 1
    const price = parseFloat(o.price_omr) || 0
    const comm = parseFloat(o.commission_omr) || 0
    const netVal = parseFloat(o.net_revenue_omr) || 0

    if (o.status === 'cancelled') {
      cancelled += 1
    } else {
      gross += price
      commission += comm
      net += netVal
      if (o.status === 'completed') completed += 1
      if (o.status === 'pending' || o.status === 'confirmed' || o.status === 'active') pipeline += 1
      if (o.payment_status === 'paid') paid += price
      else unpaid += price
    }

    const created = o.created_at ? new Date(o.created_at) : start
    const day = `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(2, '0')}-${String(created.getUTCDate()).padStart(2, '0')}`
    const bucket = dailyMap.get(day) || { orders: 0, revenue: 0 }
    bucket.orders += 1
    if (o.status !== 'cancelled') bucket.revenue += price
    dailyMap.set(day, bucket)
  }

  const daily_orders: SupplierStats['daily_orders'] = []
  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    const b = dailyMap.get(key) || { orders: 0, revenue: 0 }
    daily_orders.push({ day: key, orders: b.orders, revenue: b.revenue })
  }

  return {
    supplier,
    month,
    month_label: monthLabel(month),
    catalog: {
      packages: Number(pkgCount?.n || 0),
      services: Number(svcCount?.n || 0),
      active_packages: Number(activePkg?.n || 0),
    },
    settlement: {
      orders_total: list.length,
      orders_active_pipeline: pipeline,
      orders_completed: completed,
      orders_cancelled: cancelled,
      gross_omr: Math.round(gross * 100) / 100,
      commission_omr: Math.round(commission * 100) / 100,
      net_omr: Math.round(net * 100) / 100,
      paid_omr: Math.round(paid * 100) / 100,
      unpaid_omr: Math.round(unpaid * 100) / 100,
    },
    status_counts,
    daily_orders,
    recent_orders: list.slice(0, 40).map(toOrderRow),
  }
}

/** List suppliers with current-month settlement snapshot. */
export async function listSuppliersWithMonthSnapshot(
  month: SupplierMonthKey = currentMonthKey(),
): Promise<SupplierListItem[]> {
  const { start, end } = monthBounds(month)
  const rows = await db.select().from(suppliers).orderBy(asc(suppliers.sort_order), asc(suppliers.name_en))

  const pkgCounts = await db
    .select({
      supplier_id: packages.supplier_id,
      n: count(),
    })
    .from(packages)
    .groupBy(packages.supplier_id)

  const svcCounts = await db
    .select({
      supplier_id: hospitalityServices.supplier_id,
      n: count(),
    })
    .from(hospitalityServices)
    .where(eq(hospitalityServices.is_archived, false))
    .groupBy(hospitalityServices.supplier_id)

  const orderAgg = await db
    .select({
      supplier_id: packages.supplier_id,
      orders_n: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} <> 'cancelled' THEN 1 ELSE 0 END), 0)`,
      cancelled_n: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} = 'cancelled' THEN 1 ELSE 0 END), 0)`,
      gross: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} <> 'cancelled' THEN ${orders.price_omr}::numeric ELSE 0 END), 0)`,
      paid: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} <> 'cancelled' AND ${orders.payment_status} = 'paid' THEN ${orders.price_omr}::numeric ELSE 0 END), 0)`,
    })
    .from(orders)
    .innerJoin(packages, eq(orders.package_id, packages.id))
    .where(and(gte(orders.created_at, start), lt(orders.created_at, end)))
    .groupBy(packages.supplier_id)

  const pkgMap = Object.fromEntries(pkgCounts.map((r) => [r.supplier_id || '', Number(r.n)]))
  const svcMap = Object.fromEntries(svcCounts.map((r) => [r.supplier_id || '', Number(r.n)]))
  const ordMap = Object.fromEntries(
    orderAgg.map((r) => [
      r.supplier_id || '',
      {
        orders: Number(r.orders_n || 0),
        cancelled: Number(r.cancelled_n || 0),
        gross: Number(r.gross || 0),
        paid: Number(r.paid || 0),
      },
    ]),
  )

  return rows.map((s) => ({
    ...s,
    packages_count: pkgMap[s.id] || 0,
    services_count: svcMap[s.id] || 0,
    month_orders: ordMap[s.id]?.orders || 0,
    month_cancelled: ordMap[s.id]?.cancelled || 0,
    month_gross_omr: Math.round((ordMap[s.id]?.gross || 0) * 100) / 100,
    month_paid_omr: Math.round((ordMap[s.id]?.paid || 0) * 100) / 100,
  }))
}
