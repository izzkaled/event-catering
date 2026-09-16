import { NextResponse } from 'next/server'
import { readCatalogBlob } from '@/lib/uploads/catalog-image'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ key: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { key: raw } = await context.params
  const key = decodeURIComponent(raw || '').replace(/[^a-zA-Z0-9._-]/g, '')
  if (!key || key.includes('..')) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  const blob = await readCatalogBlob(key)
  if (!blob) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new NextResponse(Buffer.from(blob.data), {
    headers: {
      'Content-Type': blob.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
