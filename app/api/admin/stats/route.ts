import { NextResponse } from 'next/server'
import { sql, desc, eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
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
      .where(sql`${site_visits.created_at} > NOW() - INTERVAL '5 minutes'`)

    const [todayVisits] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(site_visits)
      .where(sql`${site_visits.created_at}::date = CURRENT_DATE`)

    const [monthVisits] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(site_visits)
      .where(sql`${site_visits.created_at} >= date_trunc('month', CURRENT_DATE)`)

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

    const statusCounts = {
      pending: allOrders.filter((o) => o.status === 'pending').length,
      confirmed: allOrders.filter((o) => o.status === 'confirmed').length,
      active: allOrders.filter((o) => o.status === 'active').length,
      completed: allOrders.filter((o) => o.status === 'completed').length,
      cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
    }

    const monthlyRevenue: Record<string, number> = {}
    for (const order of paidOrders) {
      const d = new Date(order.created_at!)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + parseFloat(order.price_omr)
    }

    const packageBreakdown: Record<string, number> = {}
    for (const order of allOrders) {
      const key = `${order.hours_per_visit}h/${order.visits_per_week}v`
      packageBreakdown[key] = (packageBreakdown[key] || 0) + 1
    }

    const areaBreakdown: Record<string, number> = {}
    for (const order of allOrders) {
      areaBreakdown[order.customer_area] = (areaBreakdown[order.customer_area] || 0) + 1
    }

    return NextResponse.json({
      liveVisitors: Number(liveVisitors?.count ?? 0),
      todayVisits: Number(todayVisits?.count ?? 0),
      monthVisits: Number(monthVisits?.count ?? 0),
      totalOrders: allOrders.length,
      statusCounts,
      totalRevenue,
      totalCommission,
      totalNet,
      monthlyRevenue,
      packageBreakdown,
      areaBreakdown,
      recentOrders: allOrders.slice(0, 5),
      notifications,
    })
  } catch (error) {
    console.error('GET /api/admin/stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
