import { NextResponse } from 'next/server'
import {
  sendOrderConfirmation,
  type OrderConfirmationEvent,
} from '@/lib/email/send-order-confirmation'
import { verifyInternalApi } from '@/lib/security/internal-api'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit'
import { requireCloudflareProxy } from '@/lib/cloudflare/proxy'

export async function POST(request: Request) {
  try {
    const proxyDenied = requireCloudflareProxy(request)
    if (proxyDenied) return proxyDenied

    const denied = verifyInternalApi(request)
    if (denied) return denied

    const ip = getClientIp(request)
    if (!(await checkRateLimit(`send-confirm:${ip}`))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = (await request.json().catch(() => null)) as {
      orderId?: string
      event?: OrderConfirmationEvent
    } | null
    const orderId = body?.orderId
    const event = body?.event
    if (!orderId || !event) {
      return NextResponse.json({ error: 'Missing orderId or event' }, { status: 400 })
    }
    if (event !== 'created' && event !== 'confirmed' && event !== 'cancelled') {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }

    const result = await sendOrderConfirmation({ orderId, event })
    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/send-confirmation:', error)
    return NextResponse.json({ error: 'Failed to send confirmation' }, { status: 500 })
  }
}
