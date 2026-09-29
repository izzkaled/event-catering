import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PackagesCatalog } from '@/components/packages/packages-catalog'
import {
  getActiveCategoriesCached,
  getPublishedPackagesCached,
  STOREFRONT_REVALIDATE_SECONDS,
} from '@/lib/cache/storefront'
import { SITE_URL } from '@/lib/seo'

export const revalidate = STOREFRONT_REVALIDATE_SECONDS

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
    getPublishedPackagesCached(),
    getActiveCategoriesCached(),
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
