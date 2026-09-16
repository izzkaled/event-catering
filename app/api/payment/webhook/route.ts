import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { fulfillPaymobOrder } from '@/lib/paymob/fulfill'
import { verifyPaymobTransactionHmac } from '@/lib/paymob/client'
import { parsePaymobSourceData } from '@/lib/paymob/payment-channel'

export const dynamic = 'force-dynamic'

type PaymobWebhookBody = {
  type?: string
  obj?: {
    id?: number | string
    success?: boolean
    pending?: boolean
    integration_id?: number | string
    data?: { message?: string }
    source_data?: { pan?: unknown; sub_type?: unknown; type?: unknown }
    order?: {
      id?: number | string
      merchant_order_id?: string
    }
    [key: string]: unknown
  }
}

/**
 * POST /api/payment/webhook
 * Paymob Transaction Processed callback. HMAC must be verified before mutating state.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const hmac = url.searchParams.get('hmac') || ''
    const body = (await request.json().catch(() => null)) as PaymobWebhookBody | null
    const obj = body?.obj

    if (!obj || !hmac || !verifyPaymobTransactionHmac(obj, hmac)) {
      console.warn('Paymob webhook: invalid HMAC or missing obj')
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 })
    }

    const success = obj.success === true && obj.pending === false
    const orderNumber = obj.order?.merchant_order_id
      ? String(obj.order.merchant_order_id)
      : null
    const transactionId = obj.id != null ? String(obj.id) : null
    const parsed = parsePaymobSourceData({
      source_data: obj.source_data,
      integration_id: obj.integration_id,
      data_message: obj.data?.message,
    })

    if (success && orderNumber && transactionId) {
      const result = await fulfillPaymobOrder({
        orderNumber,
        transactionId,
        paymentChannel: parsed.channel,
        cardLast4: parsed.cardLast4,
      })
      if (!result.ok) {
        console.error('Paymob fulfill failed:', result.reason, orderNumber)
      }
    } else if (orderNumber && obj.success === false) {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.order_number, orderNumber))
        .limit(1)
      if (order && order.payment_status !== 'paid') {
        await db
          .update(orders)
          .set({
            payment_status: 'failed',
            payment_channel: parsed.channel !== 'card' ? parsed.channel : order.payment_channel,
            payment_card_last4: parsed.cardLast4 ?? order.payment_card_last4,
            paymob_transaction_id: transactionId || order.paymob_transaction_id,
            updated_at: new Date(),
          })
          .where(eq(orders.id, order.id))
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('POST /api/payment/webhook:', error)
    return NextResponse.json({ received: true, error: 'processed_with_error' })
  }
}
