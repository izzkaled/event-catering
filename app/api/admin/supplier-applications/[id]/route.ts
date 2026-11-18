import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { supplierApplications } from '@/lib/db/schema'
import { APPLICATION_STATUS_IDS } from '@/lib/suppliers/application-options'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, ctx: Ctx) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await ctx.params
    const body = await request.json()
    const patch: Partial<{
      status: string
      admin_notes: string | null
      updated_at: Date
    }> = { updated_at: new Date() }

    if (body.status != null) {
      const status = String(body.status)
      if (!APPLICATION_STATUS_IDS.has(status as never)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      patch.status = status
    }
    if (body.admin_notes !== undefined) {
      patch.admin_notes =
        body.admin_notes == null ? null : String(body.admin_notes).trim().slice(0, 1000)
    }

    const [row] = await db
      .update(supplierApplications)
      .set(patch)
      .where(eq(supplierApplications.id, id))
      .returning()

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(row)
  } catch (error) {
    console.error('PATCH /api/admin/supplier-applications/[id]:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await ctx.params
    const [row] = await db
      .delete(supplierApplications)
      .where(eq(supplierApplications.id, id))
      .returning()
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/admin/supplier-applications/[id]:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
