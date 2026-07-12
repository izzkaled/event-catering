import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeWebhookSecret, isStripeEnabled } from '@/lib/stripe/config'
import { fulfillStripeOrder } from '@/lib/stripe/fulfill-order'
import { getStripe } from '@/lib/stripe/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const webhookSecret = getStripeWebhookSecret()
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (e) {
    console.error('[stripe/webhook] Signature verification failed:', e)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.order_id || session.client_reference_id
      if (!orderId) {
        console.error('[stripe/webhook] Missing order_id in session metadata')
        return NextResponse.json({ received: true })
      }

      if (session.payment_status !== 'paid') {
        return NextResponse.json({ received: true })
      }

      const result = await fulfillStripeOrder(orderId, session.id)
      if (!result.ok) {
        console.error('[stripe/webhook] Fulfillment failed:', result.reason)
      }
    }
  } catch (e) {
    console.error('[stripe/webhook]', e)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
