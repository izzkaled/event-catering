import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { packages, packageServices } from '@/lib/db/schema'
import { visitsPerMonthFromWeekly } from '@/lib/booking/schedule'
import { getAllPackagesAdmin, getMaxFeaturedPackages, getPackageWithServices } from '@/lib/packages/storefront'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function GET(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized
  const { id } = await context.params
  const pkg = await getPackageWithServices(id)
  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(pkg)
}

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date() }

    const strFields = [
      'name_ar',
      'name_en',
      'short_description_ar',
      'short_description_en',
      'description_ar',
      'description_en',
      'pricing_model',
      'cover_image',
      'status',
    ] as const
    for (const key of strFields) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    if (body.slug !== undefined) {
      const slug = slugify(String(body.slug))
      const clash = await db.select({ id: packages.id }).from(packages).where(eq(packages.slug, slug)).limit(1)
      if (clash.length && clash[0].id !== id) {
        return NextResponse.json({ error: 'Slug already used' }, { status: 400 })
      }
      updates.slug = slug
    }

    if (body.occasion_types !== undefined) {
      updates.occasion_types = Array.isArray(body.occasion_types) ? body.occasion_types.map(String) : []
    }
    if (body.gallery !== undefined) {
      updates.gallery = Array.isArray(body.gallery) ? body.gallery.map(String) : []
    }
    if (body.features_ar !== undefined) {
      updates.features_ar = Array.isArray(body.features_ar) ? body.features_ar.map(String) : []
    }
    if (body.features_en !== undefined) {
      updates.features_en = Array.isArray(body.features_en) ? body.features_en.map(String) : []
    }

    if (body.hours_per_visit !== undefined) updates.hours_per_visit = Number(body.hours_per_visit)
    if (body.min_guests !== undefined) updates.min_guests = Number(body.min_guests)
    if (body.max_guests !== undefined) updates.max_guests = Number(body.max_guests)
    if (body.per_guest_omr !== undefined) {
      updates.per_guest_omr = body.per_guest_omr == null ? null : Number(body.per_guest_omr).toFixed(2)
    }
    if (body.price_omr !== undefined) updates.price_omr = parseFloat(String(body.price_omr)).toFixed(2)

    if (body.visits_per_week !== undefined) {
      const weekly = Number.parseInt(String(body.visits_per_week), 10)
      if (!Number.isFinite(weekly) || weekly < 1 || weekly > 500) {
        return NextResponse.json({ error: 'Guest count must be between 1 and 500' }, { status: 400 })
      }
      updates.visits_per_week = weekly
      if (body.visits_per_month === undefined) {
        updates.visits_per_month = visitsPerMonthFromWeekly(weekly)
      }
    }
    if (body.visits_per_month !== undefined) updates.visits_per_month = Number(body.visits_per_month)
    if (body.section_id !== undefined) updates.section_id = body.section_id || null
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)

    if (body.status !== undefined) {
      updates.status = body.status
      if (body.is_active === undefined) {
        updates.is_active = body.status === 'published'
      }
    }
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)

    if (body.is_popular !== undefined || body.is_featured !== undefined) {
      const popular = Boolean(body.is_popular ?? body.is_featured)
      if (popular) {
        const maxFeatured = await getMaxFeaturedPackages()
        const featuredCount = (await getAllPackagesAdmin()).filter(
          (p) => p.id !== id && (p.is_popular || p.is_featured),
        ).length
        if (featuredCount >= maxFeatured) {
          return NextResponse.json(
            { error: `Maximum featured packages is ${maxFeatured}` },
            { status: 400 },
          )
        }
      }
      updates.is_popular = popular
      updates.is_featured = popular
    }
    if (body.is_recommended !== undefined) updates.is_recommended = Boolean(body.is_recommended)
    if (body.is_new !== undefined) updates.is_new = Boolean(body.is_new)
    if (body.is_best_value !== undefined) updates.is_best_value = Boolean(body.is_best_value)

    const [pkg] = await db.update(packages).set(updates).where(eq(packages.id, id)).returning()
    if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (Array.isArray(body.services)) {
      await db.delete(packageServices).where(eq(packageServices.package_id, id))
      for (let i = 0; i < body.services.length; i++) {
        const link = body.services[i]
        if (!link?.service_id) continue
        const role = link.role || (link.included ? 'included' : 'optional')
        await db.insert(packageServices).values({
          package_id: id,
          service_id: link.service_id,
          role,
          included: role === 'included',
          quantity: Number(link.quantity || 1),
          custom_price_omr: link.custom_price_omr != null ? Number(link.custom_price_omr).toFixed(2) : null,
          sort_order: i,
        })
      }
    }

    const full = await getPackageWithServices(id)
    return NextResponse.json(full || pkg)
  } catch (error) {
    console.error('PATCH /api/admin/packages/[id]:', error)
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const [pkg] = await db.delete(packages).where(eq(packages.id, id)).returning()
    if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/packages/[id]:', error)
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
  }
}
