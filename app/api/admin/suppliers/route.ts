import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { currentMonthKey, listSuppliersWithMonthSnapshot } from '@/lib/admin/supplier-stats'
import { db } from '@/lib/db'
import { suppliers } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function GET(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  const url = new URL(request.url)
  const month = url.searchParams.get('month') || currentMonthKey()
  const withStats = url.searchParams.get('with_stats') === '1'

  try {
    if (withStats) {
      const rows = await listSuppliersWithMonthSnapshot(month)
      return NextResponse.json({ month, suppliers: rows })
    }
    const rows = await db.select().from(suppliers)
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/admin/suppliers:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  try {
    const body = await request.json()
    const name_ar = String(body.name_ar || '').trim()
    const name_en = String(body.name_en || '').trim()
    if (!name_ar || !name_en) {
      return NextResponse.json({ error: 'Names required' }, { status: 400 })
    }

    let slug = slugify(body.slug || name_en)
    if (!slug) slug = `supplier-${Date.now().toString(36)}`
    const clash = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.slug, slug)).limit(1)
    if (clash.length) slug = `${slug}-${Date.now().toString(36)}`

    const [row] = await db
      .insert(suppliers)
      .values({
        slug,
        name_ar,
        name_en,
        description_ar: body.description_ar || null,
        description_en: body.description_en || null,
        logo_url: body.logo_url || null,
        contact_phone: body.contact_phone || null,
        contact_email: body.contact_email || null,
        is_active: body.is_active !== false,
        sort_order: Number(body.sort_order || 0),
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/suppliers:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
