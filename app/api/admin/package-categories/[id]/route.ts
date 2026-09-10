import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { packageCategories } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  const { id } = await context.params
  const body = await request.json()
  const updates: Record<string, unknown> = { updated_at: new Date() }
  for (const key of ['name_ar', 'name_en', 'slug', 'kind', 'sort_order', 'is_active'] as const) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  const [row] = await db.update(packageCategories).set(updates).where(eq(packageCategories.id, id)).returning()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  const { id } = await context.params
  const [row] = await db
    .update(packageCategories)
    .set({ is_active: false, updated_at: new Date() })
    .where(eq(packageCategories.id, id))
    .returning()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}
