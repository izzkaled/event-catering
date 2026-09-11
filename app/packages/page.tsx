import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PackagesCatalog } from '@/components/packages/packages-catalog'
import { getActiveCategories, getPublishedPackagesWithSections } from '@/lib/packages/queries'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'باقات الضيافة | Hospitality Packages',
  description:
    'تصفّح باقات إيفنت كاترينج للجهات والشركات والمناسبات في عُمان، ثم خصّص تجربتك وأرسل الطلب. Browse Event Catering packages and customize your experience.',
  alternates: { canonical: `${SITE_URL}/packages` },
  openGraph: {
    title: 'باقات الضيافة | Hospitality Packages',
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
