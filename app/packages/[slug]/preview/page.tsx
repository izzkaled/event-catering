import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PackageDetail } from '@/components/packages/package-detail'
import { getExperiencePackageBySlug } from '@/lib/packages/queries'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

/** Admin draft/hidden preview — always live, never CDN-cached. */
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pkg = await getExperiencePackageBySlug(slug, { preview: true })
  if (!pkg) return { title: 'Package preview' }
  return {
    title: `Preview · ${pkg.name_ar}`,
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/packages/${slug}` },
  }
}

export default async function PackagePreviewPage({ params }: Props) {
  const { slug } = await params
  const pkg = await getExperiencePackageBySlug(slug, { preview: true })
  if (!pkg) notFound()

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <div className="bg-amber-500/15 px-4 py-2 text-center text-sm font-medium text-amber-900">
          Preview mode — draft/hidden packages visible to admin · {SITE_NAME}
        </div>
        <PackageDetail pkg={pkg} />
      </main>
      <SiteFooter />
    </div>
  )
}
