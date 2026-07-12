import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/get-session-user'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit'
import { getOmrExchangeRate, getStripeCurrency, isStripeEnabled } from '@/lib/stripe/config'
import { formatStripeDisplayAmount, getStripe, omrToStripeAmount } from '@/lib/stripe/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const ip = getClientIp(request)
  if (!(await checkRateLimit(`stripe-checkout:${ip}`))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { orderId?: string } | null
  const orderId = body?.orderId?.trim()
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.user_id !== sessionUser.profileId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (order.payment_status === 'paid') {
    return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
  }

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
  const currency = getStripeCurrency()
  const exchangeRate = getOmrExchangeRate()
  const amount = omrToStripeAmount(order.price_omr, exchangeRate)
  const packageLabel = order.package_name_en || order.package_name_ar || 'Cleaning subscription'

  try {
    const stripe = getStripe()
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: order.id,
      customer_email: order.customer_email || sessionUser.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: `${packageLabel} — ${order.order_number}`,
              description: `Monthly cleaning subscription (${order.price_omr} OMR)`,
            },
          },
        },
      ],
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        price_omr: order.price_omr,
      },
      success_url: `${origin}/booking/success?order=${encodeURIComponent(order.order_number)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking?cancelled=1`,
    })

    if (!checkoutSession.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }

    await db
      .update(orders)
      .set({
        payment_method: 'stripe',
        payment_status: 'unpaid',
        stripe_checkout_session_id: checkoutSession.id,
        updated_at: new Date(),
      })
      .where(eq(orders.id, order.id))

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      displayAmount: formatStripeDisplayAmount(amount, currency),
      priceOmr: order.price_omr,
    })
  } catch (e) {
    console.error('[stripe/checkout]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Checkout failed' },
      { status: 500 },
    )
  }
}
