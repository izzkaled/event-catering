import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { packageCategories } from '@/lib/db/schema'
import { getActiveCategories } from '@/lib/packages/storefront'

export const dynamic = 'force-dynamic'

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export async function GET(request: Request) {
  const publicOnly = new URL(request.url).searchParams.get('public') === '1'
  if (publicOnly) {
    const rows = await getActiveCategories()
    return NextResponse.json(rows)
  }
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  const rows = await db.select().from(packageCategories).orderBy(asc(packageCategories.sort_order))
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  const body = await request.json()
  const name_ar = String(body.name_ar || '').trim()
  const name_en = String(body.name_en || '').trim()
  if (!name_ar || !name_en) return NextResponse.json({ error: 'Names required' }, { status: 400 })
  let slug = slugify(body.slug || name_en)
  const clash = await db.select().from(packageCategories).where(eq(packageCategories.slug, slug)).limit(1)
  if (clash.length) slug = `${slug}-${Date.now().toString(36)}`

  const [row] = await db
    .insert(packageCategories)
    .values({
      slug,
      name_ar,
      name_en,
      kind: body.kind || 'occasion',
      sort_order: Number(body.sort_order || 0),
      is_active: body.is_active !== false,
    })
    .returning()
  return NextResponse.json(row, { status: 201 })
}
