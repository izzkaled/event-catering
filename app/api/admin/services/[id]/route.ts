import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { hospitalityServices } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  const { id } = await context.params
  const body = await request.json()
  const updates: Record<string, unknown> = { updated_at: new Date() }
  for (const key of [
    'name_ar',
    'name_en',
    'description_ar',
    'description_en',
    'category',
    'image_url',
    'is_active',
    'is_archived',
    'sort_order',
  ] as const) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  if (body.price_omr !== undefined) updates.price_omr = Number(body.price_omr).toFixed(2)
  if (body.slug !== undefined) {
    updates.slug = String(body.slug)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  const [row] = await db.update(hospitalityServices).set(updates).where(eq(hospitalityServices.id, id)).returning()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  const { id } = await context.params
  // Soft archive by default
  const [row] = await db
    .update(hospitalityServices)
    .set({ is_archived: true, is_active: false, updated_at: new Date() })
    .where(eq(hospitalityServices.id, id))
    .returning()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}
