import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { schedule_events } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

const VALID_TYPES = new Set(['campaign', 'event', 'deadline', 'meeting', 'urgent'])

export async function GET() {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const all = await db.select().from(schedule_events).orderBy(asc(schedule_events.start_at))
    return NextResponse.json(all)
  } catch (error) {
    console.error('GET /api/admin/schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const { title, type = 'event', start_at, end_at } = body

    if (!title?.trim() || !start_at || !end_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const start = new Date(start_at)
    const end = new Date(end_at)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ error: 'Invalid start/end time' }, { status: 400 })
    }

    const [event] = await db
      .insert(schedule_events)
      .values({
        title: title.trim(),
        type: VALID_TYPES.has(type) ? type : 'event',
        start_at: start,
        end_at: end,
      })
      .returning()

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/schedule:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
