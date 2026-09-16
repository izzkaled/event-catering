import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { hospitalityServices } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export async function GET() {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  const rows = await db.select().from(hospitalityServices).orderBy(asc(hospitalityServices.sort_order))
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  try {
    const body = await request.json()
    const name_ar = String(body.name_ar || '').trim()
    const name_en = String(body.name_en || '').trim()
    const category = String(body.category || 'additional').trim()
    if (!name_ar || !name_en) {
      return NextResponse.json({ error: 'Names required' }, { status: 400 })
    }
    let slug = slugify(body.slug || name_en)
    const clash = await db.select().from(hospitalityServices).where(eq(hospitalityServices.slug, slug)).limit(1)
    if (clash.length) slug = `${slug}-${Date.now().toString(36)}`

    const [row] = await db
      .insert(hospitalityServices)
      .values({
        slug,
        name_ar,
        name_en,
        description_ar: body.description_ar || null,
        description_en: body.description_en || null,
        category,
        pricing_model: body.pricing_model === 'per_guest' ? 'per_guest' : 'fixed',
        price_omr: Number(body.price_omr || 0).toFixed(2),
        image_url: body.image_url || null,
        is_active: body.is_active !== false,
        is_archived: false,
        sort_order: Number(body.sort_order || 0),
      })
      .returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('POST services:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
