import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import {
  IMAGE_SPECS,
  storeCatalogImage,
  validateImageFile,
  type ImageKind,
} from '@/lib/uploads/catalog-image'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const KINDS = new Set<ImageKind>(['package_cover', 'service'])

export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const form = await request.formData()
    const file = form.get('file')
    const kindRaw = String(form.get('kind') || 'package_cover')
    const kind = (KINDS.has(kindRaw as ImageKind) ? kindRaw : 'package_cover') as ImageKind

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file' }, { status: 400 })
    }

    const invalid = validateImageFile(file, kind)
    if (invalid) {
      return NextResponse.json({ error: invalid, tip: IMAGE_SPECS[kind] }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const stored = await storeCatalogImage({
      buffer,
      mimeType: file.type,
      kind,
      originalName: file.name,
    })

    return NextResponse.json({
      url: stored.url,
      key: stored.key,
      kind,
      tip: IMAGE_SPECS[kind],
    })
  } catch (error) {
    console.error('POST /api/admin/upload:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
