import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/get-session-user'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/payment/status/:id
 * :id can be order UUID or order_number (e.g. SPD-2026-0001)
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }

    const { id } = await context.params
    const looksLikeUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)

    const [order] = looksLikeUuid
      ? await db.select().from(orders).where(eq(orders.id, id)).limit(1)
      : await db.select().from(orders).where(eq(orders.order_number, id)).limit(1)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id && order.user_id !== sessionUser.profileId && sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      transactionId: order.paymob_transaction_id || order.payment_reference,
      amountOmr: order.price_omr,
      paidAt: order.paid_at,
      refundStatus: order.refund_status,
      refundAmountOmr: order.refund_amount_omr,
      transferReceiptUrl: order.transfer_receipt_url ? true : false,
      packageNameAr: order.package_name_ar,
      packageNameEn: order.package_name_en,
      hoursPerVisit: order.hours_per_visit,
      visitsPerWeek: order.visits_per_week,
      startDate: order.start_date,
      preferredTime: order.preferred_time,
      customerName: order.customer_name,
      customerArea: order.customer_area,
    })
  } catch (error) {
    console.error('GET /api/payment/status:', error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
