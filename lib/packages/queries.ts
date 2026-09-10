import { and, asc, eq, getTableColumns } from 'drizzle-orm'
import { db } from '@/lib/db'
import { packageSections, packages } from '@/lib/db/schema'
import type { PackageWithSection } from '@/lib/packages/types'
import { FALLBACK_PACKAGES } from '@/lib/packages/fallback'

export type { PackageWithSection } from '@/lib/packages/types'
export { groupPackagesBySection, isPackagePopular } from '@/lib/packages/types'

export async function getActivePackagesWithSections(): Promise<PackageWithSection[]> {
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
      .where(eq(packages.is_active, true))
      .orderBy(asc(packageSections.sort_order), asc(packages.sort_order))

    if (!rows.length) return FALLBACK_PACKAGES

    return rows.map((row) => ({
      ...row,
      is_popular: row.is_popular || Boolean(row.is_featured),
    }))
  } catch {
    return FALLBACK_PACKAGES
  }
}
