import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const all = await db.select().from(orders).orderBy(desc(orders.created_at))
    return NextResponse.json(all)
  } catch (error) {
    console.error('GET /api/admin/orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
