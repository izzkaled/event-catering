import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { packageSections } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const rows = await db.select().from(packageSections).orderBy(asc(packageSections.sort_order))
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/admin/package-sections:', error)
    return NextResponse.json({ error: 'Failed to load sections' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = (await request.json()) as {
      slug?: string
      name_ar?: string
      name_en?: string
      description_ar?: string
      description_en?: string
      sort_order?: number
    }

    const nameAr = body.name_ar?.trim() ?? ''
    const nameEn = body.name_en?.trim() ?? ''

    if (!nameAr || !nameEn) {
      return NextResponse.json({ error: 'الاسم بالعربي والإنجليزي مطلوبان' }, { status: 400 })
    }

    const slugFromInput = String(body.slug ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const slugFromEn = nameEn
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const slug = slugFromInput || slugFromEn

    if (!slug) {
      return NextResponse.json(
        { error: 'المعرّف (slug) مطلوب — استخدم حروفاً إنجليزية مثل laundry' },
        { status: 400 },
      )
    }

    try {
      const [section] = await db
        .insert(packageSections)
        .values({
          slug,
          name_ar: nameAr,
          name_en: nameEn,
          description_ar: body.description_ar?.trim() || null,
          description_en: body.description_en?.trim() || null,
          sort_order: body.sort_order ?? 0,
        })
        .returning()

      return NextResponse.json(section, { status: 201 })
    } catch (insertError: unknown) {
      const message = insertError instanceof Error ? insertError.message : ''
      if (message.includes('unique') || message.includes('duplicate')) {
        return NextResponse.json({ error: 'هذا المعرّف مستخدم مسبقاً' }, { status: 409 })
      }
      throw insertError
    }
  } catch (error) {
    console.error('POST /api/admin/package-sections:', error)
    return NextResponse.json({ error: 'فشل إنشاء القسم' }, { status: 500 })
  }
}
