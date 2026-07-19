import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { admin_notifications, orders } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/get-session-user'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit'
import { getBankDetails, storeTransferReceipt } from '@/lib/paymob/bank'
import { triggerOrderConfirmation } from '@/lib/security/trigger-confirmation'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

/**
 * GET /api/bank-transfer/upload — bank account details for display
 * POST /api/bank-transfer/upload — multipart: orderId, receipt, notes?
 */
export async function GET() {
  return NextResponse.json({ bank: getBankDetails() })
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!(await checkRateLimit(`bank-transfer:${ip}`))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }

    const form = await request.formData()
    const orderId = String(form.get('orderId') || '')
    const notes = String(form.get('notes') || '').trim() || null
    const file = form.get('receipt')

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'receipt file required' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use JPG, PNG, WEBP, or PDF.' },
        { status: 400 },
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id && order.user_id !== sessionUser.profileId && sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 409 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await storeTransferReceipt({
      buffer,
      mimeType: file.type,
      orderNumber: order.order_number,
    })

    const [updated] = await db
      .update(orders)
      .set({
        payment_method: 'bank_transfer',
        payment_status: 'pending_verification',
        transfer_receipt_url: url,
        verification_notes: notes,
        payment_reference: order.order_number,
        updated_at: new Date(),
      })
      .where(eq(orders.id, order.id))
      .returning()

    await db.insert(admin_notifications).values({
      order_id: order.id,
      message: `تحويل بنكي بانتظار التحقق: ${order.order_number}`,
    })

    triggerOrderConfirmation(order.id, 'created')

    return NextResponse.json({
      ok: true,
      orderNumber: updated.order_number,
      paymentStatus: updated.payment_status,
    })
  } catch (error) {
    console.error('POST /api/bank-transfer/upload:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
