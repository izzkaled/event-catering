import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/get-session-user'
import { isStripeEnabled } from '@/lib/stripe/config'
import { fulfillStripeOrder } from '@/lib/stripe/fulfill-order'
import { getStripe } from '@/lib/stripe/server'

export const dynamic = 'force-dynamic'

/** Verify checkout session after redirect (fallback if webhook is delayed). */
export async function GET(request: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')?.trim()
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    const orderId = session.metadata?.order_id || session.client_reference_id
    if (!orderId) {
      return NextResponse.json({ error: 'Order not linked to session' }, { status: 400 })
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    if (!order || order.user_id !== sessionUser.profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (session.payment_status === 'paid' && order.payment_status !== 'paid') {
      await fulfillStripeOrder(orderId, session.id)
    }

    const [updated] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)

    return NextResponse.json({
      orderNumber: updated?.order_number ?? order.order_number,
      paymentStatus: updated?.payment_status ?? order.payment_status,
      paid: updated?.payment_status === 'paid',
    })
  } catch (e) {
    console.error('[stripe/verify-session]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Verification failed' },
      { status: 500 },
    )
  }
}
