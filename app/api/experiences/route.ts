import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { savedExperiences } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = String(body.id || '').trim()
    const payload = body.payload
    if (!id || !payload) {
      return NextResponse.json({ error: 'id and payload required' }, { status: 400 })
    }

    const [row] = await db
      .insert(savedExperiences)
      .values({
        id,
        package_id: body.package_id || null,
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
        estimated_total_omr:
          body.estimated_total_omr != null
            ? Number(body.estimated_total_omr).toFixed(2)
            : null,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: savedExperiences.id,
        set: {
          payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
          package_id: body.package_id || null,
          estimated_total_omr:
            body.estimated_total_omr != null
              ? Number(body.estimated_total_omr).toFixed(2)
              : null,
          updated_at: new Date(),
        },
      })
      .returning()

    return NextResponse.json(row)
  } catch (error) {
    console.error('POST /api/experiences:', error)
    // Client still has localStorage — soft fail
    return NextResponse.json({ ok: false, localOnly: true }, { status: 200 })
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const [row] = await db.select().from(savedExperiences).where(eq(savedExperiences.id, id)).limit(1)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(row)
  } catch (error) {
    console.error('GET /api/experiences:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
