import { NextResponse } from 'next/server'
import { asc, count, eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { emailCollections, emailContacts } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function GET() {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const collections = await db
      .select()
      .from(emailCollections)
      .orderBy(asc(emailCollections.name))

    const counts = await db
      .select({
        collection_id: emailContacts.collection_id,
        total: count(),
      })
      .from(emailContacts)
      .groupBy(emailContacts.collection_id)

    const countMap = new Map(counts.map((c) => [c.collection_id, Number(c.total)]))

    return NextResponse.json(
      collections.map((c) => ({
        ...c,
        contact_count: countMap.get(c.id) ?? 0,
      })),
    )
  } catch (error) {
    console.error('GET /api/admin/email-collections:', error)
    return NextResponse.json({ error: 'فشل تحميل المجموعات' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = (await request.json()) as {
      name?: string
      description?: string
      emails?: Array<string | { email: string; company_name?: string; notes?: string }>
    }

    const name = body.name?.trim()
    if (!name) {
      return NextResponse.json({ error: 'اسم المجموعة مطلوب' }, { status: 400 })
    }

    const [collection] = await db
      .insert(emailCollections)
      .values({
        name,
        description: body.description?.trim() || null,
      })
      .returning()

    const rows = (body.emails || [])
      .map((item) => {
        if (typeof item === 'string') {
          return { email: normalizeEmail(item), company_name: null as string | null, notes: null as string | null }
        }
        return {
          email: normalizeEmail(item.email || ''),
          company_name: item.company_name?.trim() || null,
          notes: item.notes?.trim() || null,
        }
      })
      .filter((r) => isValidEmail(r.email))

    const unique = new Map(rows.map((r) => [r.email, r]))
    if (unique.size) {
      await db.insert(emailContacts).values(
        [...unique.values()].map((r) => ({
          collection_id: collection.id,
          email: r.email,
          company_name: r.company_name,
          notes: r.notes,
        })),
      )
    }

    return NextResponse.json(
      { ...collection, contact_count: unique.size },
      { status: 201 },
    )
  } catch (error) {
    console.error('POST /api/admin/email-collections:', error)
    return NextResponse.json({ error: 'فشل إنشاء المجموعة' }, { status: 500 })
  }
}
