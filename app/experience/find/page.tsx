import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FindExperience } from '@/components/experience/find-experience'
import { getExperiencePackages } from '@/lib/packages/queries'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'صمم ضيافتك | كاترينج مخصص حسب المناسبة في عُمان',
  description:
    'أجب عن بضعة أسئلة وسنرشّح كاترينج وضيافة تناسب مناسبتك وميزانيتك في عُمان.',
  keywords: [
    'تخصيص ضيافة',
    'كاترينج حسب المناسبة',
    'find catering Oman',
    'custom hospitality package',
  ],
  alternates: { canonical: `${SITE_URL}/experience/find` },
  openGraph: {
    title: 'صمم ضيافتك | كاترينج مخصص في عُمان',
    description: 'ترشيح كاترينج وضيافة حسب مناسبتك وميزانيتك في عُمان.',
    url: `${SITE_URL}/experience/find`,
  },
}

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
