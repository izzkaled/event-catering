import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { admin_notifications, orders, packages } from '@/lib/db/schema'
import { OMAN_PHONE_REGEX, normalizePhone } from '@/lib/constants'
import { getSessionUser } from '@/lib/auth/get-session-user'
import { safeSyncProfileFromOrder } from '@/lib/auth/profile-update'
import { validateOrderPayload } from '@/lib/security/order-validation'
import { triggerOrderConfirmation } from '@/lib/security/trigger-confirmation'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit'
import { requireTurnstile } from '@/lib/cloudflare/turnstile'
import { isStripeEnabled } from '@/lib/stripe/config'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!(await checkRateLimit(`orders:${ip}`))) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Login required to place an order' }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as (Record<string, unknown> & {
      turnstileToken?: string
    }) | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const turnstileDenied = await requireTurnstile(request, body.turnstileToken)
    if (turnstileDenied) return turnstileDenied

    const packageId = String(body.package_id ?? '')
    const [pkg] = packageId
      ? await db.select().from(packages).where(eq(packages.id, packageId)).limit(1)
      : [undefined]

    const validated = validateOrderPayload(body, pkg)
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const phoneDigits = validated.data.customer_phone.replace(/\D/g, '')
    if (!OMAN_PHONE_REGEX.test(phoneDigits)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    const stripeCheckout = isStripeEnabled()

    // Retry on order_number unique collision (two orders arriving at once).
    let order: typeof orders.$inferSelect | undefined
    for (let attempt = 0; attempt < 3 && !order; attempt++) {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(orders)
      const nextNum = Number(count ?? 0) + 1 + attempt
      const orderNumber = `SPD-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`

      try {
        ;[order] = await db
          .insert(orders)
          .values({
            order_number: orderNumber,
            user_id: sessionUser.profileId,
            customer_name: validated.data.customer_name,
            customer_phone: normalizePhone(phoneDigits),
            customer_email: validated.data.customer_email,
            customer_address: validated.data.customer_address,
            customer_area: validated.data.customer_area,
            notes: validated.data.notes,
            package_id: validated.data.package_id,
            package_name_ar: pkg?.name_ar ?? null,
            package_name_en: pkg?.name_en ?? null,
            hours_per_visit: validated.data.hours_per_visit,
            visits_per_week: validated.data.visits_per_week,
            visits_per_month: validated.data.visits_per_month,
            price_omr: validated.data.price_omr,
            commission_omr: validated.data.commission_omr,
            net_revenue_omr: validated.data.net_revenue_omr,
            start_date: validated.data.start_date,
            end_date: validated.data.end_date,
            preferred_time: validated.data.preferred_time,
            preferred_days: validated.data.preferred_days,
            status: 'pending',
            payment_method: stripeCheckout ? 'stripe' : 'bank_transfer',
            payment_status: stripeCheckout ? 'unpaid' : 'not_required',
          })
          .returning()
      } catch (e) {
        const isUniqueViolation =
          e instanceof Error && /orders_order_number|duplicate key/i.test(e.message)
        if (!isUniqueViolation || attempt === 2) throw e
      }
    }
    if (!order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    await db.insert(admin_notifications).values({
      order_id: order.id,
      message: `طلب اشتراك جديد: ${order.order_number}`,
    })

    try {
      await safeSyncProfileFromOrder(sessionUser.profileId, {
        name: validated.data.customer_name,
        phone: validated.data.customer_phone,
        email: validated.data.customer_email || sessionUser.email,
        area: validated.data.customer_area,
        address: validated.data.customer_address,
      })
    } catch (profileError) {
      console.error('Failed to sync profile from order:', profileError)
    }

    if (!stripeCheckout) {
      triggerOrderConfirmation(order.id, 'created')
    }

    return NextResponse.json({ ...order, stripeCheckout }, { status: 201 })
  } catch (error) {
    console.error('POST /api/orders:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
