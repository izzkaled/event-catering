import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { packages } from '@/lib/db/schema'
import { visitsPerMonthFromWeekly } from '@/lib/booking/schedule'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const body = await request.json()

    const updates: Record<string, unknown> = { updated_at: new Date() }

    if (body.name_ar !== undefined) updates.name_ar = body.name_ar
    if (body.name_en !== undefined) updates.name_en = body.name_en
    if (body.hours_per_visit !== undefined) updates.hours_per_visit = body.hours_per_visit
    if (body.visits_per_week !== undefined) {
      const weekly = Number.parseInt(String(body.visits_per_week), 10)
      if (!Number.isFinite(weekly) || weekly < 1 || weekly > 7) {
        return NextResponse.json({ error: 'visits_per_week must be between 1 and 7' }, { status: 400 })
      }
      updates.visits_per_week = weekly
      if (body.visits_per_month === undefined) {
        updates.visits_per_month = visitsPerMonthFromWeekly(weekly)
      }
    }
    if (body.visits_per_month !== undefined) updates.visits_per_month = body.visits_per_month
    if (body.price_omr !== undefined) updates.price_omr = parseFloat(String(body.price_omr)).toFixed(2)
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.section_id !== undefined) updates.section_id = body.section_id || null
    if (body.is_popular !== undefined) {
      updates.is_popular = Boolean(body.is_popular)
      updates.is_featured = Boolean(body.is_popular)
    } else if (body.is_featured !== undefined) {
      updates.is_featured = body.is_featured
      updates.is_popular = Boolean(body.is_featured)
    }
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order

    const [pkg] = await db
      .update(packages)
      .set(updates)
      .where(eq(packages.id, id))
      .returning()

    if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(pkg)
  } catch (error) {
    console.error('PATCH /api/admin/packages/[id]:', error)
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const [pkg] = await db.delete(packages).where(eq(packages.id, id)).returning()
    if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/packages/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
  }
}
