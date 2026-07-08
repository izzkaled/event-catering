import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { packages } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const all = await db.select().from(packages).orderBy(asc(packages.sort_order))
    return NextResponse.json(all)
  } catch (error) {
    console.error('GET /api/admin/packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const {
      name_ar,
      name_en,
      hours_per_visit,
      visits_per_week,
      visits_per_month,
      price_omr,
      sort_order = 0,
    } = body

    if (!name_ar || !name_en || !hours_per_visit || !visits_per_week || !visits_per_month || !price_omr) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const [pkg] = await db
      .insert(packages)
      .values({
        name_ar,
        name_en,
        hours_per_visit,
        visits_per_week,
        visits_per_month,
        price_omr: parseFloat(String(price_omr)).toFixed(2),
        sort_order,
      })
      .returning()

    return NextResponse.json(pkg, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/packages:', error)
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
  }
}
