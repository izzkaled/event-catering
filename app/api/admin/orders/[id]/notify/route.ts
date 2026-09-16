import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import {
  sendOrderConfirmation,
  isOrderEmailEvent,
  eventFromOrderStatus,
  type OrderConfirmationEvent,
} from '@/lib/email/send-order-confirmation'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** POST — admin resend customer/admin order notification email (+ PDF when applicable). */
export async function POST(request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const body = (await request.json().catch(() => null)) as { event?: string } | null

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let event: OrderConfirmationEvent
    if (body?.event && isOrderEmailEvent(body.event)) {
      event = body.event
    } else if (order.payment_status === 'paid') {
      event = 'paid'
    } else if (order.payment_status === 'pending_verification') {
      event = 'payment_pending'
    } else if (order.payment_status === 'failed') {
      event = 'payment_failed'
    } else {
      event = eventFromOrderStatus(order.status) || 'created'
    }

    const result = await sendOrderConfirmation({ orderId: order.id, event })
    return NextResponse.json({ ...result, event })
  } catch (error) {
    console.error('POST /api/admin/orders/[id]/notify:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
