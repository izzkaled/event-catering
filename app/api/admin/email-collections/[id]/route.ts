import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { emailCollections, emailContacts } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const [collection] = await db
      .select()
      .from(emailCollections)
      .where(eq(emailCollections.id, id))
      .limit(1)

    if (!collection) {
      return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 404 })
    }

    const contacts = await db
      .select()
      .from(emailContacts)
      .where(eq(emailContacts.collection_id, id))
      .orderBy(asc(emailContacts.email))

    return NextResponse.json({ ...collection, contacts })
  } catch (error) {
    console.error('GET /api/admin/email-collections/[id]:', error)
    return NextResponse.json({ error: 'فشل تحميل المجموعة' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const body = (await request.json()) as {
      name?: string
      description?: string | null
      emails?: Array<string | { email: string; company_name?: string; notes?: string }>
      mode?: 'replace' | 'merge'
    }

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.description !== undefined) {
      updates.description = body.description ? String(body.description).trim() : null
    }

    const [collection] = await db
      .update(emailCollections)
      .set(updates)
      .where(eq(emailCollections.id, id))
      .returning()

    if (!collection) {
      return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 404 })
    }

    if (body.emails) {
      const normalize = (value: string) => value.trim().toLowerCase()
      const isValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      const rows = body.emails
        .map((item) => {
          if (typeof item === 'string') {
            return { email: normalize(item), company_name: null as string | null, notes: null as string | null }
          }
          return {
            email: normalize(item.email || ''),
            company_name: item.company_name?.trim() || null,
            notes: item.notes?.trim() || null,
          }
        })
        .filter((r) => isValid(r.email))

      const unique = [...new Map(rows.map((r) => [r.email, r])).values()]

      if (body.mode === 'replace') {
        await db.delete(emailContacts).where(eq(emailContacts.collection_id, id))
      }

      if (unique.length) {
        const existing = await db
          .select({ email: emailContacts.email })
          .from(emailContacts)
          .where(eq(emailContacts.collection_id, id))
        const existingSet = new Set(existing.map((e) => e.email))
        const toInsert = unique.filter((r) => !existingSet.has(r.email))
        if (toInsert.length) {
          await db.insert(emailContacts).values(
            toInsert.map((r) => ({
              collection_id: id,
              email: r.email,
              company_name: r.company_name,
              notes: r.notes,
            })),
          )
        }
      }
    }

    const contacts = await db
      .select()
      .from(emailContacts)
      .where(eq(emailContacts.collection_id, id))
      .orderBy(asc(emailContacts.email))

    return NextResponse.json({ ...collection, contacts })
  } catch (error) {
    console.error('PATCH /api/admin/email-collections/[id]:', error)
    return NextResponse.json({ error: 'فشل تحديث المجموعة' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const [collection] = await db
      .delete(emailCollections)
      .where(eq(emailCollections.id, id))
      .returning()

    if (!collection) {
      return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/email-collections/[id]:', error)
    return NextResponse.json({ error: 'فشل حذف المجموعة' }, { status: 500 })
  }
}
