import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { admin_notifications, supplierApplications } from '@/lib/db/schema'
import { getClientIp, limitRequest } from '@/lib/auth/rate-limit'
import { requireTurnstile } from '@/lib/cloudflare/turnstile'
import {
  KITCHEN_TYPE_IDS,
  MAX_SUPPLIER_PHOTOS,
  PREP_SPEED_IDS,
} from '@/lib/suppliers/application-options'
import {
  IMAGE_SPECS,
  storeCatalogImage,
  validateImageFile,
} from '@/lib/uploads/catalog-image'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function moneyOrNull(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) return null
  return n.toFixed(2)
}

function intOrNull(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  const n = Number.parseInt(s, 10)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function normalizeInstagram(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  const withoutAt = s.replace(/^@+/, '')
  const fromUrl = withoutAt
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/$/, '')
  return fromUrl.slice(0, 80) || null
}

/** POST — public supplier registration (multipart). Admin-only visibility. */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (!(await limitRequest(`supplier-apply:${ip}`, 'write'))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const form = await request.formData()
    const turnstileDenied = await requireTurnstile(
      request,
      String(form.get('turnstileToken') || ''),
    )
    if (turnstileDenied) return turnstileDenied

    const company_name = String(form.get('company_name') || '').trim()
    const contact_phone = String(form.get('contact_phone') || '').trim()
    const prep_speed = String(form.get('prep_speed') || '').trim()
    const kitchen_type = String(form.get('kitchen_type') || '').trim()
    const desserts_type = String(form.get('desserts_type') || '').trim() || null
    const notes = String(form.get('notes') || '').trim() || null
    const instagram = normalizeInstagram(String(form.get('instagram') || ''))

    if (!company_name || company_name.length < 2) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 })
    }
    if (!contact_phone || contact_phone.length < 7) {
      return NextResponse.json({ error: 'Contact phone required' }, { status: 400 })
    }
    if (!PREP_SPEED_IDS.has(prep_speed as never)) {
      return NextResponse.json({ error: 'Invalid prep speed' }, { status: 400 })
    }
    if (!KITCHEN_TYPE_IDS.has(kitchen_type as never)) {
      return NextResponse.json({ error: 'Invalid kitchen type' }, { status: 400 })
    }

    const files = form
      .getAll('photos')
      .filter((f): f is File => f instanceof File && f.size > 0)

    if (files.length > MAX_SUPPLIER_PHOTOS) {
      return NextResponse.json(
        { error: `Max ${MAX_SUPPLIER_PHOTOS} photos` },
        { status: 400 },
      )
    }

    const photo_urls: string[] = []
    for (const file of files) {
      const invalid = validateImageFile(file, 'supplier_gallery')
      if (invalid) {
        return NextResponse.json(
          { error: invalid, tip: IMAGE_SPECS.supplier_gallery },
          { status: 400 },
        )
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      const stored = await storeCatalogImage({
        buffer,
        mimeType: file.type,
        kind: 'supplier_gallery',
        originalName: file.name,
      })
      photo_urls.push(stored.url)
    }

    const [row] = await db
      .insert(supplierApplications)
      .values({
        company_name: company_name.slice(0, 120),
        contact_phone: contact_phone.slice(0, 40),
        prep_speed,
        breakfast_price_omr: moneyOrNull(form.get('breakfast_price_omr')),
        lunch_price_omr: moneyOrNull(form.get('lunch_price_omr')),
        dinner_price_omr: moneyOrNull(form.get('dinner_price_omr')),
        snacks_price_omr: moneyOrNull(form.get('snacks_price_omr')),
        instagram,
        desserts_type: desserts_type?.slice(0, 200) || null,
        min_order_qty: intOrNull(form.get('min_order_qty')),
        min_order_price_omr: moneyOrNull(form.get('min_order_price_omr')),
        kitchen_type,
        photo_urls,
        notes: notes?.slice(0, 1000) || null,
        status: 'pending',
      })
      .returning()

    await db
      .insert(admin_notifications)
      .values({
        message: `طلب تسجيل مورد جديد: ${company_name} — ${contact_phone}`,
      })
      .catch(() => null)

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 })
  } catch (error) {
    console.error('POST /api/suppliers/apply:', error)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
