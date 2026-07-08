import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { orders, type OrderStatus } from '@/lib/db/schema'
import { triggerOrderConfirmation } from '@/lib/security/trigger-confirmation'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

const ALLOWED: OrderStatus[] = ['pending', 'confirmed', 'active', 'cancelled', 'completed']

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const body = await request.json()

    const updates: Record<string, unknown> = { updated_at: new Date() }
    let becameConfirmed = false
    let becameCancelled = false

    const [current] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (body.status !== undefined) {
      if (!ALLOWED.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = body.status
      becameCancelled = body.status === 'cancelled' && current.status !== 'cancelled'
      if (body.status === 'cancelled') {
        // Payment not received — zero financial amounts
        updates.price_omr = '0.00'
        updates.commission_omr = '0.00'
        updates.net_revenue_omr = '0.00'
      }
      if (body.status === 'confirmed' || body.status === 'active') {
        if (!current.end_date && current.start_date) {
          const d = new Date(`${current.start_date}T12:00:00`)
          d.setMonth(d.getMonth() + 1)
          updates.end_date = d.toISOString().slice(0, 10)
        }
        becameConfirmed = current.status !== body.status && body.status === 'confirmed'
      }
    }

    const [order] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning()

    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // On confirmation, send customer a "confirmed" PDF invoice
    if (becameConfirmed) {
      triggerOrderConfirmation(new URL(request.url).origin, order.id, 'confirmed')
    }

    if (becameCancelled) {
      triggerOrderConfirmation(new URL(request.url).origin, order.id, 'cancelled')
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('PATCH /api/admin/orders/[id]:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
