import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { admin_notifications, orders } from '@/lib/db/schema'
import { triggerOrderConfirmation } from '@/lib/security/trigger-confirmation'

/** Mark order paid after successful Paymob payment. Idempotent. */
export async function fulfillPaymobOrder(opts: {
  orderId?: string
  orderNumber?: string
  transactionId: string
  intentionId?: string | null
}): Promise<{ ok: true; orderNumber: string } | { ok: false; reason: string }> {
  const [order] = opts.orderId
    ? await db.select().from(orders).where(eq(orders.id, opts.orderId)).limit(1)
    : opts.orderNumber
      ? await db
          .select()
          .from(orders)
          .where(eq(orders.order_number, opts.orderNumber))
          .limit(1)
      : []

  if (!order) {
    return { ok: false, reason: 'Order not found' }
  }

  if (order.payment_status === 'paid') {
    return { ok: true, orderNumber: order.order_number }
  }

  await db
    .update(orders)
    .set({
      payment_status: 'paid',
      payment_method: 'paymob',
      paymob_transaction_id: opts.transactionId,
      paymob_intention_id: opts.intentionId ?? order.paymob_intention_id,
      payment_reference: opts.transactionId,
      paid_at: new Date(),
      status: 'confirmed',
      updated_at: new Date(),
    })
    .where(eq(orders.id, order.id))

  await db.insert(admin_notifications).values({
    order_id: order.id,
    message: `تم الدفع عبر Paymob: ${order.order_number}`,
  })

  triggerOrderConfirmation(order.id, 'confirmed')

  return { ok: true, orderNumber: order.order_number }
}

/** Approve a bank transfer after admin verifies the receipt. */
export async function approveBankTransfer(
  orderId: string,
  notes?: string,
): Promise<{ ok: true; orderNumber: string } | { ok: false; reason: string }> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return { ok: false, reason: 'Order not found' }

  if (order.payment_status === 'paid') {
    return { ok: true, orderNumber: order.order_number }
  }

  await db
    .update(orders)
    .set({
      payment_status: 'paid',
      payment_method: 'bank_transfer',
      paid_at: new Date(),
      status: 'confirmed',
      verification_notes: notes?.trim() || order.verification_notes,
      updated_at: new Date(),
    })
    .where(eq(orders.id, orderId))

  await db.insert(admin_notifications).values({
    order_id: orderId,
    message: `تمت الموافقة على التحويل البنكي: ${order.order_number}`,
  })

  triggerOrderConfirmation(orderId, 'confirmed')

  return { ok: true, orderNumber: order.order_number }
}

/** Reject bank transfer / request new receipt. */
export async function rejectBankTransfer(
  orderId: string,
  notes?: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) return { ok: false, reason: 'Order not found' }

  await db
    .update(orders)
    .set({
      payment_status: 'failed',
      transfer_receipt_url: null,
      verification_notes: notes?.trim() || 'Rejected — new receipt required',
      updated_at: new Date(),
    })
    .where(eq(orders.id, orderId))

  await db.insert(admin_notifications).values({
    order_id: orderId,
    message: `رُفض التحويل البنكي: ${order.order_number}`,
  })

  return { ok: true }
}
