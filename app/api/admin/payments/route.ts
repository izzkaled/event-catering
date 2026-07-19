import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { adminPaymentSelect } from '@/lib/admin/payment-select'

export const dynamic = 'force-dynamic'

/** GET /api/admin/payments — list orders with payment fields (no receipt blobs). */
export async function GET() {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const rows = await db
      .select(adminPaymentSelect)
      .from(orders)
      .orderBy(desc(orders.created_at))
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/admin/payments:', error)
    return NextResponse.json({ error: 'Failed to load payments' }, { status: 500 })
  }
}
