import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/get-session-user'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit'
import {
  createPaymobIntention,
  isPaymobEnabled,
  splitCustomerName,
} from '@/lib/paymob/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/payment/create
 * Body: { orderId: string } | { orderNumber: string }
 * Creates a Paymob intention and returns Unified Checkout URL.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!(await checkRateLimit(`payment-create:${ip}`))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    if (!isPaymobEnabled()) {
      return NextResponse.json(
        { error: 'Paymob is not configured. Set PAYMOB_* env vars.' },
        { status: 503 },
      )
    }

    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as {
      orderId?: string
      orderNumber?: string
    } | null

    if (!body?.orderId && !body?.orderNumber) {
      return NextResponse.json({ error: 'orderId or orderNumber required' }, { status: 400 })
    }

    const [order] = body.orderId
      ? await db.select().from(orders).where(eq(orders.id, body.orderId)).limit(1)
      : await db
          .select()
          .from(orders)
          .where(eq(orders.order_number, String(body.orderNumber)))
          .limit(1)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id && order.user_id !== sessionUser.profileId && sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid', orderNumber: order.order_number }, { status: 409 })
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order cancelled' }, { status: 400 })
    }

    const { firstName, lastName } = splitCustomerName(order.customer_name)
    const itemName =
      order.package_name_en || order.package_name_ar || `Order ${order.order_number}`

    const intention = await createPaymobIntention({
      amountOmr: order.price_omr,
      specialReference: order.order_number,
      itemName,
      customer: {
        firstName,
        lastName,
        email: order.customer_email || `${order.order_number}@orders.local`,
        phone: order.customer_phone,
        street: order.customer_address,
        city: order.customer_area || 'Muscat',
        country: 'OMN',
      },
    })

    await db
      .update(orders)
      .set({
        payment_method: 'paymob',
        payment_status: 'unpaid',
        paymob_intention_id: intention.id || null,
        payment_reference: order.order_number,
        updated_at: new Date(),
      })
      .where(eq(orders.id, order.id))

    return NextResponse.json({
      checkoutUrl: intention.checkoutUrl,
      intentionId: intention.id,
      orderNumber: order.order_number,
      orderId: order.id,
    })
  } catch (error) {
    console.error('POST /api/payment/create:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 },
    )
  }
}
