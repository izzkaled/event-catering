import { NextResponse } from 'next/server'
import { sql, desc, eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { calcCommissionBreakdown } from '@/lib/constants'
import { db } from '@/lib/db'
import { admin_notifications, orders, site_visits } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.created_at))

    const [liveVisitors] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${site_visits.visitor_id})` })
      .from(site_visits)
      .where(
        sql`${site_visits.created_at} > NOW() - INTERVAL '5 minutes'
          AND ${site_visits.visitor_id} IS NOT NULL
          AND ${site_visits.visitor_id} <> ''`,
      )

    // Unique people (not page hits / heartbeats)
    const [todayVisits] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${site_visits.visitor_id})` })
      .from(site_visits)
      .where(
        sql`${site_visits.created_at}::date = CURRENT_DATE
          AND ${site_visits.visitor_id} IS NOT NULL
          AND ${site_visits.visitor_id} <> ''`,
      )

    const [monthVisits] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${site_visits.visitor_id})` })
      .from(site_visits)
      .where(
        sql`${site_visits.created_at} >= date_trunc('month', CURRENT_DATE)
          AND ${site_visits.visitor_id} IS NOT NULL
          AND ${site_visits.visitor_id} <> ''`,
      )

    const dailyVisitRows = await db
      .select({
        day: sql<string>`(${site_visits.created_at})::date`,
        count: sql<number>`COUNT(DISTINCT ${site_visits.visitor_id})`,
      })
      .from(site_visits)
      .where(
        sql`${site_visits.created_at} >= CURRENT_DATE - INTERVAL '13 days'
          AND ${site_visits.visitor_id} IS NOT NULL
          AND ${site_visits.visitor_id} <> ''`,
      )
      .groupBy(sql`(${site_visits.created_at})::date`)

    const dailyVisitMap = Object.fromEntries(
      dailyVisitRows.map((row) => [String(row.day).slice(0, 10), Number(row.count ?? 0)]),
    )
    const dailyVisits = Array.from({ length: 14 }, (_, i) => {
      const d = new Date()
      d.setHours(12, 0, 0, 0)
      d.setDate(d.getDate() - (13 - i))
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return { day: key, visits: dailyVisitMap[key] || 0 }
    })

    const monthlyOrders: Record<string, number> = {}
    for (const order of allOrders) {
      const created = order.created_at ? new Date(order.created_at) : new Date()
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
      monthlyOrders[key] = (monthlyOrders[key] || 0) + 1
    }

    const notifications = await db
      .select()
      .from(admin_notifications)
      .where(eq(admin_notifications.is_read, false))
      .orderBy(desc(admin_notifications.created_at))
      .limit(10)

    const paidOrders = allOrders.filter((o) => o.status !== 'cancelled')

    const totalRevenue = paidOrders.reduce((s, o) => s + parseFloat(o.price_omr), 0)
    const totalCommission = paidOrders.reduce((s, o) => s + parseFloat(o.commission_omr), 0)
    const totalNet = paidOrders.reduce((s, o) => s + parseFloat(o.net_revenue_omr), 0)

    let totalCeoCommission = 0
    let totalDevCommission = 0
    let totalGatewayFee = 0
    for (const order of paidOrders) {
      const price = parseFloat(order.price_omr) || 0
      const ch = order.payment_channel || order.payment_method
      const bd = calcCommissionBreakdown(price, ch)
      totalCeoCommission += bd.ceo
      totalDevCommission += bd.developer
      totalGatewayFee += bd.gateway
    }

    const statusCounts = {
      pending: allOrders.filter((o) => o.status === 'pending').length,
      confirmed: allOrders.filter((o) => o.status === 'confirmed').length,
      active: allOrders.filter((o) => o.status === 'active').length,
      completed: allOrders.filter((o) => o.status === 'completed').length,
      cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
    }

    const monthlyRevenue: Record<string, number> = {}
    const monthlyFinance: Record<string, { revenue: number; commission: number; net: number; orders: number }> = {}
    for (const order of paidOrders) {
      const created = order.created_at ? new Date(order.created_at) : new Date()
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
      const revenue = parseFloat(order.price_omr) || 0
      const commission = parseFloat(order.commission_omr) || 0
      const net = parseFloat(order.net_revenue_omr) || 0
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + revenue
      if (!monthlyFinance[key]) monthlyFinance[key] = { revenue: 0, commission: 0, net: 0, orders: 0 }
      monthlyFinance[key].revenue += revenue
      monthlyFinance[key].commission += commission
      monthlyFinance[key].net += net
      monthlyFinance[key].orders += 1
    }

    const packageBreakdown: Record<string, number> = {}
    for (const order of allOrders) {
      const key = order.package_name_ar || order.package_name_en || `${order.hours_per_visit}h`
      packageBreakdown[key] = (packageBreakdown[key] || 0) + 1
    }

    const areaBreakdown: Record<string, number> = {}
    for (const order of allOrders) {
      areaBreakdown[order.customer_area] = (areaBreakdown[order.customer_area] || 0) + 1
    }

    const paymentChannelCounts = {
      visa: 0,
      mastercard: 0,
      apple_pay: 0,
      card: 0,
      bank_transfer: 0,
      other: 0,
    }
    for (const order of allOrders) {
      if (order.payment_status !== 'paid' && order.payment_status !== 'partially_refunded') continue
      const ch =
        order.payment_channel ||
        (order.payment_method === 'bank_transfer'
          ? 'bank_transfer'
          : order.payment_method === 'stripe'
            ? 'stripe'
            : order.payment_method === 'paymob'
              ? 'paymob'
              : 'unknown')
      if (ch === 'visa') paymentChannelCounts.visa += 1
      else if (ch === 'mastercard') paymentChannelCounts.mastercard += 1
      else if (ch === 'apple_pay') paymentChannelCounts.apple_pay += 1
      else if (ch === 'bank_transfer') paymentChannelCounts.bank_transfer += 1
      else if (ch === 'card' || ch === 'paymob') paymentChannelCounts.card += 1
      else paymentChannelCounts.other += 1
    }

    return NextResponse.json({
      liveVisitors: Number(liveVisitors?.count ?? 0),
      todayVisits: Number(todayVisits?.count ?? 0),
      monthVisits: Number(monthVisits?.count ?? 0),
      dailyVisits,
      totalOrders: allOrders.length,
      statusCounts,
      totalRevenue,
      totalCommission,
      totalCeoCommission,
      totalDevCommission,
      totalGatewayFee,
      totalNet,
      monthlyRevenue,
      monthlyFinance,
      monthlyOrders,
      packageBreakdown,
      areaBreakdown,
      paymentChannelCounts,
      recentOrders: allOrders.slice(0, 5),
      notifications,
    })
  } catch (error) {
    console.error('GET /api/admin/stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
