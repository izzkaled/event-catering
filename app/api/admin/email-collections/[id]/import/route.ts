import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { emailCollections, emailContacts } from '@/lib/db/schema'
import { parseEmailCsv } from '@/lib/email/parse-email-csv'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** POST /api/admin/email-collections/[id]/import — CSV text or multipart file */
export async function POST(request: Request, context: RouteContext) {
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

    const contentType = request.headers.get('content-type') || ''
    let csvText = ''
    let mode: 'merge' | 'replace' = 'merge'

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file')
      mode = form.get('mode') === 'replace' ? 'replace' : 'merge'
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'ارفع ملف CSV' }, { status: 400 })
      }
      if (!file.name.toLowerCase().endsWith('.csv') && file.type && !file.type.includes('csv') && !file.type.includes('text')) {
        return NextResponse.json({ error: 'الملف يجب أن يكون CSV' }, { status: 400 })
      }
      csvText = await file.text()
    } else {
      const body = (await request.json()) as { csv?: string; mode?: string }
      csvText = body.csv || ''
      mode = body.mode === 'replace' ? 'replace' : 'merge'
    }

    const parsed = parseEmailCsv(csvText)
    if (!parsed.length) {
      return NextResponse.json({ error: 'لم يُعثر على إيميلات صالحة في الملف' }, { status: 400 })
    }

    if (mode === 'replace') {
      await db.delete(emailContacts).where(eq(emailContacts.collection_id, id))
    }

    const existing = await db
      .select({ email: emailContacts.email })
      .from(emailContacts)
      .where(eq(emailContacts.collection_id, id))
    const existingSet = new Set(existing.map((e) => e.email))

    const toInsert = parsed.filter((r) => !existingSet.has(r.email))
    if (toInsert.length) {
      // Insert in chunks to avoid payload limits
      const chunkSize = 200
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize)
        await db.insert(emailContacts).values(
          chunk.map((r) => ({
            collection_id: id,
            email: r.email,
            company_name: r.company_name,
            notes: r.notes,
          })),
        )
      }
    }

    await db
      .update(emailCollections)
      .set({ updated_at: new Date() })
      .where(eq(emailCollections.id, id))

    return NextResponse.json({
      success: true,
      imported: toInsert.length,
      skipped: parsed.length - toInsert.length,
      total_parsed: parsed.length,
    })
  } catch (error) {
    console.error('POST import email-collection:', error)
    return NextResponse.json({ error: 'فشل استيراد CSV' }, { status: 500 })
  }
}
