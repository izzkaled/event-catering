import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { DEFAULT_SUPPLIER_ID, hospitalityServices, packages, suppliers } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function GET(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  const { id } = await context.params
  const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

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
    'logo_url',
    'contact_phone',
    'contact_email',
    'is_active',
    'sort_order',
  ] as const) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)
  if (body.slug !== undefined) {
    updates.slug = slugify(String(body.slug))
  }

  const [row] = await db.update(suppliers).set(updates).where(eq(suppliers.id, id)).returning()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  const { id } = await context.params

  if (id === DEFAULT_SUPPLIER_ID) {
    return NextResponse.json({ error: 'Cannot delete the default supplier' }, { status: 400 })
  }

  // Soft-disable + reassign linked rows to the default supplier
  await db
    .update(packages)
    .set({ supplier_id: DEFAULT_SUPPLIER_ID, updated_at: new Date() })
    .where(eq(packages.supplier_id, id))
  await db
    .update(hospitalityServices)
    .set({ supplier_id: DEFAULT_SUPPLIER_ID, updated_at: new Date() })
    .where(eq(hospitalityServices.supplier_id, id))

  const [row] = await db
    .update(suppliers)
    .set({ is_active: false, updated_at: new Date() })
    .where(eq(suppliers.id, id))
    .returning()

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}
