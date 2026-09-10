import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { packages, packageServices } from '@/lib/db/schema'
import { visitsPerMonthFromWeekly } from '@/lib/booking/schedule'
import { getAllPackagesAdmin, getMaxFeaturedPackages } from '@/lib/packages/storefront'

export const dynamic = 'force-dynamic'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function GET() {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const [all, maxFeatured] = await Promise.all([getAllPackagesAdmin(), getMaxFeaturedPackages()])
    return NextResponse.json({ packages: all, max_featured_packages: maxFeatured })
  } catch (error) {
    console.error('GET /api/admin/packages:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const name_ar = String(body.name_ar || '').trim()
    const name_en = String(body.name_en || '').trim()
    if (!name_ar || !name_en) {
      return NextResponse.json({ error: 'name_ar and name_en required' }, { status: 400 })
    }

    const minGuests = Number(body.min_guests ?? body.visits_per_week ?? 25)
    const maxGuests = Number(body.max_guests ?? Math.max(minGuests, 50))
    const typical = Number(body.visits_per_week ?? Math.round((minGuests + maxGuests) / 2))
    if (!Number.isFinite(typical) || typical < 1 || typical > 500) {
      return NextResponse.json({ error: 'Guest count must be between 1 and 500' }, { status: 400 })
    }

    const price = parseFloat(String(body.price_omr ?? 0))
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const slugBase = slugify(body.slug || name_en)
    let slug = slugBase || `package-${Date.now()}`
    const existing = await db.select({ id: packages.id }).from(packages).where(eq(packages.slug, slug)).limit(1)
    if (existing.length) slug = `${slug}-${Date.now().toString(36)}`

    const maxFeatured = await getMaxFeaturedPackages()
    const wantFeatured = Boolean(body.is_featured || body.is_popular)
    if (wantFeatured) {
      const featuredCount = (await getAllPackagesAdmin()).filter((p) => p.is_popular || p.is_featured).length
      if (featuredCount >= maxFeatured) {
        return NextResponse.json(
          { error: `Maximum featured packages is ${maxFeatured}. Unfeature another package first.` },
          { status: 400 },
        )
      }
    }

    const hours = Number(body.hours_per_visit ?? 4)
    const occasion_types = Array.isArray(body.occasion_types) ? body.occasion_types.map(String) : []

    const [pkg] = await db
      .insert(packages)
      .values({
        name_ar,
        name_en,
        slug,
        short_description_ar: body.short_description_ar || null,
        short_description_en: body.short_description_en || null,
        description_ar: body.description_ar || null,
        description_en: body.description_en || null,
        occasion_types,
        pricing_model: body.pricing_model || 'starting_from',
        hours_per_visit: hours,
        visits_per_week: typical,
        visits_per_month: body.visits_per_month != null ? Number(body.visits_per_month) : visitsPerMonthFromWeekly(typical),
        min_guests: minGuests,
        max_guests: maxGuests,
        per_guest_omr: body.per_guest_omr != null ? Number(body.per_guest_omr).toFixed(2) : null,
        price_omr: price.toFixed(2),
        cover_image: body.cover_image || '/images/brand/brand-table.webp',
        gallery: Array.isArray(body.gallery) ? body.gallery.map(String) : ['/images/brand/brand-table.webp'],
        features_ar: Array.isArray(body.features_ar) ? body.features_ar.map(String) : [],
        features_en: Array.isArray(body.features_en) ? body.features_en.map(String) : [],
        status: body.status || 'draft',
        section_id: body.section_id || null,
        is_active: body.status ? body.status === 'published' : false,
        is_popular: Boolean(body.is_popular),
        is_featured: Boolean(body.is_popular || body.is_featured),
        is_recommended: Boolean(body.is_recommended),
        is_new: Boolean(body.is_new),
        is_best_value: Boolean(body.is_best_value),
        sort_order: Number(body.sort_order ?? 0),
      })
      .returning()

    const serviceLinks = Array.isArray(body.services) ? body.services : []
    for (let i = 0; i < serviceLinks.length; i++) {
      const link = serviceLinks[i]
      if (!link?.service_id) continue
      const role = link.role || (link.included ? 'included' : 'optional')
      await db.insert(packageServices).values({
        package_id: pkg.id,
        service_id: link.service_id,
        role,
        included: role === 'included',
        quantity: Number(link.quantity || 1),
        custom_price_omr: link.custom_price_omr != null ? Number(link.custom_price_omr).toFixed(2) : null,
        sort_order: i,
      })
    }

    return NextResponse.json(pkg, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/packages:', error)
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
  }
}
