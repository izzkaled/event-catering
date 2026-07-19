import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { packageSections } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const body = (await request.json()) as Record<string, unknown>
    const updates: Record<string, unknown> = { updated_at: new Date() }

    if (body.name_ar !== undefined) updates.name_ar = String(body.name_ar).trim()
    if (body.name_en !== undefined) updates.name_en = String(body.name_en).trim()
    if (body.description_ar !== undefined) {
      updates.description_ar = body.description_ar ? String(body.description_ar).trim() : null
    }
    if (body.description_en !== undefined) {
      updates.description_en = body.description_en ? String(body.description_en).trim() : null
    }
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)

    const [section] = await db
      .update(packageSections)
      .set(updates)
      .where(eq(packageSections.id, id))
      .returning()

    if (!section) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(section)
  } catch (error) {
    console.error('PATCH /api/admin/package-sections/[id]:', error)
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const [section] = await db.delete(packageSections).where(eq(packageSections.id, id)).returning()
    if (!section) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/package-sections/[id]:', error)
    return NextResponse.json({ error: 'Cannot delete section with linked packages' }, { status: 400 })
  }
}
