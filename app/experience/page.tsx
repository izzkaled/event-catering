import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ExperienceBuilder } from '@/components/experience/experience-builder'
import { getExperiencePackageBySlug, incrementPackageStat } from '@/lib/packages/queries'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ package?: string; experience?: string; request?: string }>
}

async function BuilderInner({ searchParams }: Props) {
  const sp = await searchParams
  const slug = sp.package
  if (!slug) notFound()
  const pkg = await getExperiencePackageBySlug(slug)
  if (!pkg) notFound()
  if (!pkg.id.startsWith('fallback-')) {
    void incrementPackageStat(pkg.id, 'customizations_count')
  }
  return <ExperienceBuilder pkg={pkg} initialDraftId={sp.experience || null} />
}

export default function ExperiencePage(props: Props) {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <Suspense fallback={<div className="site-container py-16">…</div>}>
          <BuilderInner {...props} />
        </Suspense>
      </main>
      <div className="hidden sm:block">
        <SiteFooter />
      </div>
    </div>
  )
}
