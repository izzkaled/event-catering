import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { schedule_events } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const [event] = await db
      .delete(schedule_events)
      .where(eq(schedule_events.id, id))
      .returning()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/schedule/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
