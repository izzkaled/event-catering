import type { Package } from '@/lib/db/schema'

export type PackageWithSection = Package & {
  section_slug: string | null
  section_name_ar: string | null
  section_name_en: string | null
}

export function groupPackagesBySection(items: PackageWithSection[]) {
  const map = new Map<
    string,
    {
      slug: string
      name_ar: string
      name_en: string
      packages: PackageWithSection[]
    }
  >()

  for (const pkg of items) {
    const slug = pkg.section_slug || 'other'
    const name_ar = pkg.section_name_ar || 'خدمات أخرى'
    const name_en = pkg.section_name_en || 'Other services'
    const existing = map.get(slug)
    if (existing) {
      existing.packages.push(pkg)
    } else {
      map.set(slug, { slug, name_ar, name_en, packages: [pkg] })
    }
  }

  return [...map.values()]
}

export function isPackagePopular(pkg: Pick<Package, 'is_popular' | 'is_featured'>): boolean {
  return Boolean(pkg.is_popular || pkg.is_featured)
}
