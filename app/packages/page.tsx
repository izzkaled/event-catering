import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PackagesCatalog } from '@/components/packages/packages-catalog'
import { getActiveCategories, getPublishedPackagesWithSections } from '@/lib/packages/queries'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'باقات كاترينج وضيافة عُمان | حكومي وشركات ومناسبات',
  description:
    'تصفّح باقات الكاترينج والضيافة في عُمان للجهات والشركات والمناسبات. خصّص حسب احتياجك وأرسل الطلب أونلاين.',
  keywords: [
    'باقات كاترينج عمان',
    'باقات ضيافة مسقط',
    'ضيافة حكومية',
    'ضيافة شركات',
    'catering packages Oman',
  ],
  alternates: { canonical: `${SITE_URL}/packages` },
  openGraph: {
    title: 'باقات كاترينج وضيافة عُمان | حكومي وشركات ومناسبات',
    description: 'باقات كاترينج وضيافة في عُمان — تخصيص وطلب أونلاين.',
    url: `${SITE_URL}/packages`,
  },
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
