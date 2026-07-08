import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { admin_notifications, orders, packages } from '@/lib/db/schema'
import {
  OMAN_PHONE_REGEX,
  addOneMonth,
  calcCommission,
  calcNetRevenue,
  normalizePhone,
} from '@/lib/constants'
import { getSessionUser } from '@/lib/auth/get-session-user'
import { safeSyncProfileFromOrder } from '@/lib/auth/profile-update'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      customer_area,
      notes,
      package_id,
      hours_per_visit,
      visits_per_week,
      visits_per_month,
      price_omr,
      start_date,
      preferred_time,
      preferred_days,
    } = body

    if (
      !customer_name?.trim() ||
      !customer_phone?.trim() ||
      !customer_address?.trim() ||
      !customer_area ||
      !package_id ||
      !hours_per_visit ||
      !visits_per_week ||
      !visits_per_month ||
      !price_omr ||
      !start_date ||
      !preferred_time ||
      !preferred_days?.length
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const phoneDigits = customer_phone.replace(/\D/g, '')
    if (!OMAN_PHONE_REGEX.test(phoneDigits)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    const price = parseFloat(String(price_omr))
    const commission = calcCommission(price)
    const netRevenue = calcNetRevenue(price)
    const endDate = addOneMonth(String(start_date))

    const [pkg] = await db.select().from(packages).where(eq(packages.id, package_id)).limit(1)

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(orders)
    const nextNum = Number(count ?? 0) + 1
    const orderNumber = `SPD-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`

    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Login required to place an order' }, { status: 401 })
    }

    const [order] = await db
      .insert(orders)
      .values({
        order_number: orderNumber,
        user_id: sessionUser.profileId,
        customer_name: customer_name.trim(),
        customer_phone: normalizePhone(phoneDigits),
        customer_email: customer_email?.trim() || null,
        customer_address: customer_address.trim(),
        customer_area,
        notes: notes?.trim() || null,
        package_id,
        package_name_ar: pkg?.name_ar ?? null,
        package_name_en: pkg?.name_en ?? null,
        hours_per_visit,
        visits_per_week,
        visits_per_month,
        price_omr: price.toFixed(2),
        commission_omr: commission.toFixed(2),
        net_revenue_omr: netRevenue.toFixed(2),
        start_date,
        end_date: endDate,
        preferred_time,
        preferred_days,
        status: 'pending',
      })
      .returning()

    await db.insert(admin_notifications).values({
      order_id: order.id,
      message: `طلب اشتراك جديد: ${order.order_number}`,
    })

    // Persist customer details on this account only (skip phone if already used elsewhere)
    try {
      await safeSyncProfileFromOrder(sessionUser.profileId, {
        name: customer_name.trim(),
        phone: customer_phone,
        email: customer_email?.trim() || sessionUser.email,
        area: customer_area,
        address: customer_address.trim(),
      })
    } catch (profileError) {
      console.error('Failed to sync profile from order:', profileError)
    }

    const origin = new URL(request.url).origin
    fetch(`${origin}/api/send-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, event: 'created' }),
    }).catch(console.error)

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('POST /api/orders:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
