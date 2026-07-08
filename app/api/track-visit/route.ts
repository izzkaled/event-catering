import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { site_visits } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { page = '/', visitor_id } = body

    await db.insert(site_visits).values({
      page,
      visitor_id: visitor_id || null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/track-visit:', error)
    return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 })
  }
}
