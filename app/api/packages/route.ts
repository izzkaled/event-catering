import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { packages } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const activePackages = await db
      .select()
      .from(packages)
      .where(eq(packages.is_active, true))
      .orderBy(asc(packages.sort_order))

    return NextResponse.json(activePackages)
  } catch (error) {
    console.error('GET /api/packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}
