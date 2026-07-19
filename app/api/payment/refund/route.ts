import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { admin_notifications, orders } from '@/lib/db/schema'
import { omrToPaymobAmount, refundPaymobTransaction } from '@/lib/paymob/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payment/refund
 * Admin-only full or partial refund via Paymob.
 * Body: { orderId, amountOmr?, reason? }
 */
export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = (await request.json().catch(() => null)) as {
      orderId?: string
      amountOmr?: number | string
      reason?: string
    } | null

    if (!body?.orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, body.orderId)).limit(1)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_status !== 'paid' && order.payment_status !== 'partially_refunded') {
      return NextResponse.json({ error: 'Order is not refundable' }, { status: 400 })
    }

    if (order.payment_method !== 'paymob' || !order.paymob_transaction_id) {
      return NextResponse.json(
        { error: 'Only Paymob card payments can be refunded automatically' },
        { status: 400 },
      )
    }

    const orderTotal = Number.parseFloat(order.price_omr)
    const alreadyRefunded = Number.parseFloat(order.refund_amount_omr || '0')
    const refundAmount =
      body.amountOmr !== undefined && body.amountOmr !== ''
        ? Number.parseFloat(String(body.amountOmr))
        : orderTotal - alreadyRefunded

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 })
    }

    if (refundAmount + alreadyRefunded > orderTotal + 0.001) {
      return NextResponse.json({ error: 'Refund exceeds paid amount' }, { status: 400 })
    }

    await refundPaymobTransaction(
      order.paymob_transaction_id,
      omrToPaymobAmount(refundAmount),
    )

    const newRefunded = alreadyRefunded + refundAmount
    const fullyRefunded = newRefunded >= orderTotal - 0.001
    const notes = [order.verification_notes, body.reason?.trim()]
      .filter(Boolean)
      .join(' | ')

    const [updated] = await db
      .update(orders)
      .set({
        refund_amount_omr: newRefunded.toFixed(2),
        refund_status: fullyRefunded ? 'full' : 'partial',
        payment_status: fullyRefunded ? 'refunded' : 'partially_refunded',
        verification_notes: notes || order.verification_notes,
        updated_at: new Date(),
      })
      .where(eq(orders.id, order.id))
      .returning()

    await db.insert(admin_notifications).values({
      order_id: order.id,
      message: `استرداد ${refundAmount.toFixed(2)} OMR: ${order.order_number}`,
    })

    return NextResponse.json({
      ok: true,
      order: updated,
      refundedOmr: refundAmount,
    })
  } catch (error) {
    console.error('POST /api/payment/refund:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refund failed' },
      { status: 500 },
    )
  }
}
