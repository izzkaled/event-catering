import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { site_visits } from '@/lib/db/schema'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit'

export const dynamic = 'force-dynamic'

const MAX_PAGE_LEN = 200
const MAX_VISITOR_ID_LEN = 64

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!(await checkRateLimit(`track-visit:${ip}`))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = (await request.json().catch(() => null)) as {
      page?: string
      visitor_id?: string
    } | null

    let page = typeof body?.page === 'string' ? body.page.trim().slice(0, MAX_PAGE_LEN) : '/'
    if (!page.startsWith('/')) page = '/'

    const visitor_id =
      typeof body?.visitor_id === 'string'
        ? body.visitor_id.trim().slice(0, MAX_VISITOR_ID_LEN) || null
        : null

    await db.insert(site_visits).values({
      page,
      visitor_id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/track-visit:', error)
    return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 })
  }
}
