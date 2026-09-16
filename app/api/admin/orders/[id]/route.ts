import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { admin_notifications, orders, type OrderStatus } from '@/lib/db/schema'
import { triggerOrderConfirmation } from '@/lib/security/trigger-confirmation'
import { eventFromOrderStatus } from '@/lib/email/send-order-confirmation'

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

    const [current] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let statusChanged = false
    let newStatus: OrderStatus | null = null

    if (body.status !== undefined) {
      if (!ALLOWED.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = body.status
      statusChanged = current.status !== body.status
      newStatus = body.status as OrderStatus

      if (body.status === 'cancelled') {
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
      }
    }

    const [order] = await db.update(orders).set(updates).where(eq(orders.id, id)).returning()
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (statusChanged && newStatus) {
      const event = eventFromOrderStatus(newStatus)
      if (event) {
        await db.insert(admin_notifications).values({
          order_id: order.id,
          message: `تحديث حالة الطلب ${order.order_number}: ${newStatus}`,
        })
        triggerOrderConfirmation(order.id, event)
      }
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('PATCH /api/admin/orders/[id]:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
