import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { packages, packageServices } from '@/lib/db/schema'
import { getPackageWithServices } from '@/lib/packages/storefront'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const source = await getPackageWithServices(id)
    if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const slug = `${source.slug || 'package'}-copy-${Date.now().toString(36)}`
    const [copy] = await db
      .insert(packages)
      .values({
        section_id: source.section_id,
        slug,
        name_ar: `${source.name_ar} (نسخة)`,
        name_en: `${source.name_en} (Copy)`,
        short_description_ar: source.short_description_ar,
        short_description_en: source.short_description_en,
        description_ar: source.description_ar,
        description_en: source.description_en,
        occasion_types: source.occasion_types || [],
        pricing_model: source.pricing_model || 'starting_from',
        hours_per_visit: source.hours_per_visit,
        visits_per_week: source.visits_per_week,
        visits_per_month: source.visits_per_month,
        min_guests: source.min_guests,
        max_guests: source.max_guests,
        per_guest_omr: source.per_guest_omr,
        price_omr: source.price_omr,
        cover_image: source.cover_image,
        gallery: source.gallery || [],
        features_ar: source.features_ar || [],
        features_en: source.features_en || [],
        status: 'draft',
        is_active: false,
        is_popular: false,
        is_featured: false,
        is_recommended: false,
        is_new: true,
        is_best_value: false,
        sort_order: (source.sort_order || 0) + 1,
      })
      .returning()

    for (const link of source.services) {
      await db.insert(packageServices).values({
        package_id: copy.id,
        service_id: link.service.id,
        role: link.role,
        included: link.included,
        quantity: link.quantity,
        custom_price_omr: link.custom_price_omr,
        sort_order: link.sort_order,
      })
    }

    return NextResponse.json(copy, { status: 201 })
  } catch (error) {
    console.error('POST duplicate package:', error)
    return NextResponse.json({ error: 'Failed to duplicate' }, { status: 500 })
  }
}
