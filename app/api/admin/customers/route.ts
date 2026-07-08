import { NextResponse } from 'next/server'
import { count, desc, eq, sql } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { orders, users } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const rows = await db
      .select({
        id: users.id,
        auth_user_id: users.auth_user_id,
        phone: users.phone,
        name: users.name,
        email: users.email,
        address: users.address,
        area: users.area,
        created_at: users.created_at,
        order_count: count(orders.id),
        total_spent: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.price_omr}::numeric ELSE 0 END), 0)`,
        active_subscriptions: sql<number>`COUNT(CASE WHEN ${orders.status} IN ('confirmed', 'active') THEN 1 END)::int`,
      })
      .from(users)
      .leftJoin(orders, eq(orders.user_id, users.id))
      .where(eq(users.role, 'user'))
      .groupBy(users.id)
      .orderBy(desc(users.created_at))

    const customers = rows.map((row) => ({
      ...row,
      auth_source: row.auth_user_id ? 'neon' : row.phone ? 'phone' : 'unknown',
      order_count: Number(row.order_count ?? 0),
      total_spent: parseFloat(String(row.total_spent ?? 0)).toFixed(2),
      active_subscriptions: Number(row.active_subscriptions ?? 0),
    }))

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('GET /api/admin/customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}
