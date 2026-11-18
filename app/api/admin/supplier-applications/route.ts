import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { supplierApplications } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    const rows =
      status && status !== 'all'
        ? await db
            .select()
            .from(supplierApplications)
            .where(eq(supplierApplications.status, status))
            .orderBy(desc(supplierApplications.created_at))
        : await db
            .select()
            .from(supplierApplications)
            .orderBy(desc(supplierApplications.created_at))

    return NextResponse.json({ applications: rows })
  } catch (error) {
    console.error('GET /api/admin/supplier-applications:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
