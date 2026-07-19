import { NextResponse } from 'next/server'
import { getActivePackagesWithSections } from '@/lib/packages/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const activePackages = await getActivePackagesWithSections()
    return NextResponse.json(activePackages)
  } catch (error) {
    console.error('GET /api/packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}
