import { NextResponse } from 'next/server'
import { and, eq, gte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { site_visits } from '@/lib/db/schema'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit'

export const dynamic = 'force-dynamic'

const MAX_PAGE_LEN = 200
const MAX_VISITOR_ID_LEN = 64
/** Same person cannot create another visit row within this window. */
const DEDUPE_MS = 4 * 60 * 1000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isPrivatePage(page: string) {
  return (
    page.startsWith('/admin') ||
    page.startsWith('/auth') ||
    page.startsWith('/api')
  )
}

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
    if (isPrivatePage(page)) {
      return NextResponse.json({ success: true, skipped: true })
    }

    const rawId =
      typeof body?.visitor_id === 'string' ? body.visitor_id.trim().slice(0, MAX_VISITOR_ID_LEN) : ''
    if (!UUID_RE.test(rawId)) {
      return NextResponse.json({ error: 'Invalid visitor' }, { status: 400 })
    }
    const visitor_id = rawId.toLowerCase()

    const since = new Date(Date.now() - DEDUPE_MS)
    const [recent] = await db
      .select({ id: site_visits.id })
      .from(site_visits)
      .where(and(eq(site_visits.visitor_id, visitor_id), gte(site_visits.created_at, since)))
      .limit(1)

    if (recent) {
      return NextResponse.json({ success: true, deduped: true })
    }

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
