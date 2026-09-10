import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PackagesCatalog } from '@/components/packages/packages-catalog'
import { getActiveCategories, getPublishedPackagesWithSections } from '@/lib/packages/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'الباقات | Packages',
  description: 'ضيافة مصممة لمناسبتك — اختر نقطة البداية وخصص التفاصيل.',
}

export default async function PackagesPage() {
  const [packages, categories] = await Promise.all([
    getPublishedPackagesWithSections(),
    getActiveCategories(),
  ])

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <PackagesCatalog packages={packages} categories={categories} />
      </main>
      <SiteFooter />
    </div>
  )
}
