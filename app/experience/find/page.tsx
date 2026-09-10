import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FindExperience } from '@/components/experience/find-experience'
import { getExperiencePackages } from '@/lib/packages/queries'

export const dynamic = 'force-dynamic'

export default async function FindExperiencePage() {
  const packages = await getExperiencePackages()

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <FindExperience experiencePackages={packages} />
      </main>
      <SiteFooter />
    </div>
  )
}
