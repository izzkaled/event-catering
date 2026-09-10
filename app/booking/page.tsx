import { redirect } from 'next/navigation'
import { getActivePackagesWithSections } from '@/lib/packages/queries'
import { toExperiencePackage } from '@/lib/packages/experience-map'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ package?: string; experience?: string; cancelled?: string }>
}

/**
 * Legacy /booking entry — redirect into packages / experience request flow.
 * Payment, success, and pending stay under /booking/*.
 */
export default async function BookingPage({ searchParams }: Props) {
  const sp = await searchParams
  const packageId = sp.package?.trim()
  const experienceId = sp.experience?.trim()

  if (packageId) {
    const packages = await getActivePackagesWithSections()
    const pkg = packages.find((p) => p.id === packageId)
    if (pkg) {
      const slug = toExperiencePackage(pkg).slug
      const qs = new URLSearchParams({ package: slug, request: '1' })
      if (experienceId) qs.set('experience', experienceId)
      redirect(`/experience?${qs.toString()}`)
    }
  }

  redirect('/packages')
}
