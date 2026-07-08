import { NextResponse } from 'next/server'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/get-session-user'

export const dynamic = 'force-dynamic'

/** Subscriptions belong to the logged-in account only (orders.user_id). */
export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // One-time link: orphan orders with same email as this account (legacy bookings)
  const email = user.email?.trim().toLowerCase()
  if (email) {
    await db
      .update(orders)
      .set({ user_id: user.profileId, updated_at: new Date() })
      .where(
        and(
          isNull(orders.user_id),
          sql`lower(${orders.customer_email}) = ${email}`,
        ),
      )
  }

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.user_id, user.profileId))
    .orderBy(desc(orders.created_at))

  return NextResponse.json({ subscriptions: rows })
}
