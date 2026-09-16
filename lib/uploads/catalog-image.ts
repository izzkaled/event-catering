import { createHash, randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { isCloudinaryConfigured } from '@/lib/paymob/bank'
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_SPECS,
  type ImageKind,
} from '@/lib/uploads/image-specs'

export type { ImageKind }
export { IMAGE_SPECS }

export function validateImageFile(file: File, kind: ImageKind): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return 'Invalid type — use JPG, PNG, or WebP'
  const spec = IMAGE_SPECS[kind]
  if (file.size > spec.maxBytes) {
    return `File too large — max ${(spec.maxBytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return null
}

async function uploadCloudinary(opts: {
  buffer: Buffer
  mimeType: string
  folder: string
  key: string
}): Promise<string> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY!.trim()
  const secret = process.env.CLOUDINARY_API_SECRET!.trim()
  const timestamp = Math.floor(Date.now() / 1000)
  const publicId = `${opts.folder}/${opts.key.replace(/\.[^.]+$/, '')}`
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${secret}`
  const signature = createHash('sha1').update(toSign).digest('hex')

  const form = new FormData()
  form.append('file', `data:${opts.mimeType};base64,${opts.buffer.toString('base64')}`)
  form.append('api_key', apiKey)
  form.append('timestamp', String(timestamp))
  form.append('public_id', publicId)
  form.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body: form,
  })
  const data = (await res.json().catch(() => null)) as {
    secure_url?: string
    error?: { message?: string }
  } | null
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || 'Cloudinary upload failed')
  }
  return data.secure_url
}

async function uploadBlobs(opts: { buffer: Buffer; mimeType: string; key: string }): Promise<string> {
  const { getStore } = await import('@netlify/blobs')
  const store = getStore({ name: 'catalog-images', consistency: 'strong' })
  await store.set(opts.key, opts.buffer, {
    metadata: {
      contentType: opts.mimeType,
      uploadedAt: new Date().toISOString(),
    },
  })
  return `/api/media/${opts.key}`
}

async function uploadLocal(opts: { buffer: Buffer; key: string }): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, opts.key), opts.buffer)
  return `/uploads/${opts.key}`
}

/** Store an admin catalog image; returns a public URL path or absolute URL. */
export async function storeCatalogImage(opts: {
  buffer: Buffer
  mimeType: string
  kind: ImageKind
  originalName?: string
}): Promise<{ url: string; key: string }> {
  const ext =
    opts.mimeType === 'image/png' ? 'png' : opts.mimeType === 'image/webp' ? 'webp' : 'jpg'
  const key = `${opts.kind}-${randomUUID()}.${ext}`
  const folder = opts.kind === 'package_cover' ? 'event-packages' : 'event-services'

  if (isCloudinaryConfigured()) {
    const url = await uploadCloudinary({
      buffer: opts.buffer,
      mimeType: opts.mimeType,
      folder,
      key,
    })
    return { url, key }
  }

  try {
    const url = await uploadBlobs({ buffer: opts.buffer, mimeType: opts.mimeType, key })
    return { url, key }
  } catch {
    const url = await uploadLocal({ buffer: opts.buffer, key })
    return { url, key }
  }
}

export async function readCatalogBlob(key: string): Promise<{
  data: ArrayBuffer
  contentType: string
} | null> {
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore({ name: 'catalog-images', consistency: 'strong' })
    const result = await store.getWithMetadata(key, { type: 'arrayBuffer' })
    if (!result?.data) return null
    const contentType =
      (result.metadata?.contentType as string | undefined) ||
      (key.endsWith('.png') ? 'image/png' : key.endsWith('.webp') ? 'image/webp' : 'image/jpeg')
    return { data: result.data as ArrayBuffer, contentType }
  } catch {
    return null
  }
}
