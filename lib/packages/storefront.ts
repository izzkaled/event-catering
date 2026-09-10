import { and, asc, eq, getTableColumns, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  hospitalityServices,
  packageCategories,
  packageSections,
  packageServices,
  packages,
  siteSettings,
  type HospitalityService,
  type PackageCategory,
} from '@/lib/db/schema'
import type { PackageWithSection } from '@/lib/packages/types'
import { FALLBACK_PACKAGES } from '@/lib/packages/fallback'
import type { ExperiencePackage } from '@/lib/experience/types'
import { toExperiencePackage, type PackageServiceLink } from '@/lib/packages/experience-map'

export { toExperiencePackage } from '@/lib/packages/experience-map'

export type FullPackage = PackageWithSection & {
  services: PackageServiceLink[]
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function loadServicesForPackages(packageIds: string[]) {
  if (!packageIds.length) return new Map<string, PackageServiceLink[]>()
  const rows = await db
    .select({
      link: packageServices,
      service: hospitalityServices,
    })
    .from(packageServices)
    .innerJoin(hospitalityServices, eq(packageServices.service_id, hospitalityServices.id))
    .where(inArray(packageServices.package_id, packageIds))
    .orderBy(asc(packageServices.sort_order))

  const map = new Map<string, PackageServiceLink[]>()
  for (const row of rows) {
    const list = map.get(row.link.package_id) || []
    list.push({
      id: row.link.id,
      role: row.link.role,
      included: row.link.included,
      quantity: row.link.quantity,
      custom_price_omr: row.link.custom_price_omr,
      sort_order: row.link.sort_order,
      service: row.service,
    })
    map.set(row.link.package_id, list)
  }
  return map
}

export async function getPublishedPackagesWithSections(): Promise<PackageWithSection[]> {
  try {
    const rows = await db
      .select({
        ...getTableColumns(packages),
        section_slug: packageSections.slug,
        section_name_ar: packageSections.name_ar,
        section_name_en: packageSections.name_en,
      })
      .from(packages)
      .leftJoin(
        packageSections,
        and(eq(packages.section_id, packageSections.id), eq(packageSections.is_active, true)),
      )
      .where(and(eq(packages.is_active, true), eq(packages.status, 'published')))
      .orderBy(asc(packages.sort_order), asc(packages.name_en))

    if (!rows.length) return FALLBACK_PACKAGES
    return rows.map((row) => ({
      ...row,
      is_popular: row.is_popular || Boolean(row.is_featured),
    }))
  } catch {
    return FALLBACK_PACKAGES
  }
}

export async function getActivePackagesWithSections(): Promise<PackageWithSection[]> {
  return getPublishedPackagesWithSections()
}

export async function getExperiencePackages(): Promise<ExperiencePackage[]> {
  const list = await getPublishedPackagesWithSections()
  const serviceMap = await loadServicesForPackages(
    list.map((p) => p.id).filter((id) => !id.startsWith('fallback-')),
  )
  return list.map((pkg) => toExperiencePackage(pkg, serviceMap.get(pkg.id) || []))
}

export async function getExperiencePackageBySlug(slug: string, opts?: { preview?: boolean }) {
  try {
    const rows = await db
      .select({
        ...getTableColumns(packages),
        section_slug: packageSections.slug,
        section_name_ar: packageSections.name_ar,
        section_name_en: packageSections.name_en,
      })
      .from(packages)
      .leftJoin(packageSections, eq(packages.section_id, packageSections.id))
      .where(eq(packages.slug, slug))
      .limit(1)

    const row = rows[0]
    if (!row) {
      const all = await getPublishedPackagesWithSections()
      const match = all.find((p) => (p.slug || slugify(p.name_en)) === slug)
      if (!match) return null
      return toExperiencePackage(match, [])
    }

    if (!opts?.preview && (row.status !== 'published' || !row.is_active)) {
      return null
    }

    const serviceMap = await loadServicesForPackages([row.id])
    return toExperiencePackage(
      {
        ...row,
        is_popular: row.is_popular || Boolean(row.is_featured),
      },
      serviceMap.get(row.id) || [],
    )
  } catch {
    const match = FALLBACK_PACKAGES.find((p) => slugify(p.name_en) === slug)
    return match ? toExperiencePackage(match, []) : null
  }
}

export async function getPackageWithServices(id: string): Promise<FullPackage | null> {
  const rows = await db
    .select({
      ...getTableColumns(packages),
      section_slug: packageSections.slug,
      section_name_ar: packageSections.name_ar,
      section_name_en: packageSections.name_en,
    })
    .from(packages)
    .leftJoin(packageSections, eq(packages.section_id, packageSections.id))
    .where(eq(packages.id, id))
    .limit(1)

  const row = rows[0]
  if (!row) return null
  const serviceMap = await loadServicesForPackages([id])
  return {
    ...row,
    services: serviceMap.get(id) || [],
  }
}

export async function getAllPackagesAdmin() {
  return db
    .select({
      ...getTableColumns(packages),
      section_slug: packageSections.slug,
      section_name_ar: packageSections.name_ar,
      section_name_en: packageSections.name_en,
    })
    .from(packages)
    .leftJoin(packageSections, eq(packages.section_id, packageSections.id))
    .orderBy(asc(packages.sort_order), asc(packages.created_at))
}

export async function getActiveCategories(): Promise<PackageCategory[]> {
  try {
    return await db
      .select()
      .from(packageCategories)
      .where(eq(packageCategories.is_active, true))
      .orderBy(asc(packageCategories.sort_order))
  } catch {
    return []
  }
}

export async function getActiveServices(): Promise<HospitalityService[]> {
  try {
    return await db
      .select()
      .from(hospitalityServices)
      .where(and(eq(hospitalityServices.is_active, true), eq(hospitalityServices.is_archived, false)))
      .orderBy(asc(hospitalityServices.sort_order), asc(hospitalityServices.name_en))
  } catch {
    return []
  }
}

export async function getMaxFeaturedPackages() {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'max_featured_packages'))
      .limit(1)
    const n = Number(row?.value || 3)
    return Number.isFinite(n) && n > 0 ? n : 3
  } catch {
    return 3
  }
}

export async function incrementPackageStat(
  id: string,
  field: 'views_count' | 'customizations_count' | 'requests_count' | 'bookings_count',
) {
  try {
    await db
      .update(packages)
      .set({
        [field]: sql`${packages[field]} + 1`,
        updated_at: new Date(),
      })
      .where(eq(packages.id, id))
  } catch {
    /* ignore */
  }
}

export type { PackageWithSection }
export { groupPackagesBySection, isPackagePopular } from '@/lib/packages/types'
