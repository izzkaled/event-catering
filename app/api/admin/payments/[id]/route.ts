import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { adminPaymentSelect } from '@/lib/admin/payment-select'
import { approveBankTransfer, rejectBankTransfer } from '@/lib/paymob/fulfill'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/admin/payments/[id] — receipt URL for preview (loaded on demand). */
export async function GET(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const [row] = await db
      .select({ transfer_receipt_url: orders.transfer_receipt_url })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)

    if (!row?.transfer_receipt_url) {
      return NextResponse.json({ error: 'No receipt' }, { status: 404 })
    }

    return NextResponse.json({ url: row.transfer_receipt_url })
  } catch (error) {
    console.error('GET /api/admin/payments/[id]:', error)
    return NextResponse.json({ error: 'Failed to load receipt' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/payments/[id]
 * Body: { action: 'approve' | 'reject' | 'request_receipt', notes?: string }
 */
export async function PATCH(request: Request, context: RouteContext) {  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const body = (await request.json().catch(() => null)) as {
      action?: string
      notes?: string
    } | null

    const action = body?.action
    if (!action || !['approve', 'reject', 'request_receipt'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'approve') {
      const result = await approveBankTransfer(id, body?.notes)
      if (!result.ok) {
        return NextResponse.json({ error: result.reason }, { status: 400 })
      }
    } else {
      const result = await rejectBankTransfer(
        id,
        body?.notes ||
          (action === 'request_receipt'
            ? 'Please upload a clearer transfer receipt'
            : 'Bank transfer rejected'),
      )
      if (!result.ok) {
        return NextResponse.json({ error: result.reason }, { status: 400 })
      }
    }

    const [order] = await db
      .select(adminPaymentSelect)
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1)
    return NextResponse.json(order)  } catch (error) {
    console.error('PATCH /api/admin/payments/[id]:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}
