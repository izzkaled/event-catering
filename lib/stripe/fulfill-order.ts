import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { admin_notifications, orders } from '@/lib/db/schema'
import { calcCommissionBreakdown } from '@/lib/constants'
import { triggerOrderConfirmation } from '@/lib/security/trigger-confirmation'

/** Mark order paid after successful Stripe Checkout. Idempotent. */
export async function fulfillStripeOrder(
  orderId: string,
  stripeSessionId: string,
): Promise<{ ok: true; orderNumber: string } | { ok: false; reason: string }> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) {
    return { ok: false, reason: 'Order not found' }
  }

  if (order.payment_status === 'paid') {
    return { ok: true, orderNumber: order.order_number }
  }

  const price = Number.parseFloat(order.price_omr) || 0
  const breakdown = calcCommissionBreakdown(price, 'stripe')

  await db
    .update(orders)
    .set({
      payment_status: 'paid',
      payment_method: 'stripe',
      payment_channel: 'stripe',
      commission_omr: breakdown.total.toFixed(2),
      net_revenue_omr: breakdown.net.toFixed(2),
      stripe_checkout_session_id: stripeSessionId,
      paid_at: new Date(),
      status: 'confirmed',
      updated_at: new Date(),
    })
    .where(eq(orders.id, orderId))

  await db.insert(admin_notifications).values({
    order_id: orderId,
    message: `تم الدفع عبر Stripe: ${order.order_number}`,
  })

  triggerOrderConfirmation(orderId, 'paid')

  return { ok: true, orderNumber: order.order_number }
}
