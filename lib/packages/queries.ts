import type { PackageWithSection } from '@/lib/packages/types'
import {
  getPublishedPackagesWithSections,
  getExperiencePackages,
  getExperiencePackageBySlug,
  toExperiencePackage,
} from '@/lib/packages/storefront'

export type { PackageWithSection } from '@/lib/packages/types'
export { groupPackagesBySection, isPackagePopular } from '@/lib/packages/types'
export {
  getPublishedPackagesWithSections,
  getExperiencePackages,
  getExperiencePackageBySlug,
  toExperiencePackage,
  getActiveCategories,
  getActiveServices,
  getPackageWithServices,
  getAllPackagesAdmin,
  getMaxFeaturedPackages,
  incrementPackageStat,
} from '@/lib/packages/storefront'

/** Storefront listing — published packages only (any count from DB). */
export async function getActivePackagesWithSections(): Promise<PackageWithSection[]> {
  return getPublishedPackagesWithSections()
}
