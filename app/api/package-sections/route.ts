import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { packageSections } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

/** GET /api/package-sections — active sections for public UI */
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(packageSections)
      .where(eq(packageSections.is_active, true))
      .orderBy(asc(packageSections.sort_order))
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/package-sections:', error)
    return NextResponse.json({ error: 'Failed to load sections' }, { status: 500 })
  }
}
