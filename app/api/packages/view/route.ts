import { NextResponse } from 'next/server'
import { checkSoftRateLimit, getClientIp } from '@/lib/auth/rate-limit'
import { incrementPackageStat } from '@/lib/packages/storefront'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!(await checkSoftRateLimit(`pkg-view:${ip}`, { max: 120, windowMs: 60_000 }))) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  try {
    const body = (await request.json()) as { id?: string }
    const id = String(body.id || '').trim()
    if (!id || id.startsWith('fallback-') || id.length > 80) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    void incrementPackageStat(id, 'views_count')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
