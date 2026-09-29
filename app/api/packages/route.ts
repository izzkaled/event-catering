import { NextResponse } from 'next/server'
import { getClientIp, limitRequest } from '@/lib/auth/rate-limit'
import { getPublishedPackagesCached } from '@/lib/cache/storefront'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!(await limitRequest(`packages-api:${ip}`, 'soft'))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const activePackages = await getPublishedPackagesCached()
    return NextResponse.json(activePackages, {
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=60, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('GET /api/packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}
