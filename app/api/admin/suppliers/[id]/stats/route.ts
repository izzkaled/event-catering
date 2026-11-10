import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { currentMonthKey, getSupplierStats } from '@/lib/admin/supplier-stats'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  const { id } = await context.params
  const month = new URL(request.url).searchParams.get('month') || currentMonthKey()

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
  }

  try {
    const stats = await getSupplierStats(id, month)
    if (!stats) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(stats)
  } catch (error) {
    console.error('GET /api/admin/suppliers/[id]/stats:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
