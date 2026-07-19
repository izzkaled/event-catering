import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/get-session-user'
import { buildInvoicePdfBuffer } from '@/lib/invoices/invoice-pdf'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ orderId: string }> }

/**
 * GET /api/invoice/:orderId
 * Downloads PDF invoice for the order owner or admin.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }

    const { orderId } = await context.params
    const looksLikeUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        orderId,
      )

    const [order] = looksLikeUuid
      ? await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
      : await db.select().from(orders).where(eq(orders.order_number, orderId)).limit(1)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const isAdmin = sessionUser.role === 'admin'
    if (order.user_id && order.user_id !== sessionUser.profileId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const kind = order.payment_status === 'paid' || order.status === 'confirmed' || order.status === 'active'
      ? 'confirmed'
      : 'requested'

    const buffer = await buildInvoicePdfBuffer(order, kind, isAdmin ? 'admin' : 'customer')

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.order_number}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('GET /api/invoice:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}
