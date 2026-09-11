import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PackageDetail } from '@/components/packages/package-detail'
import { getExperiencePackageBySlug, incrementPackageStat } from '@/lib/packages/queries'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pkg = await getExperiencePackageBySlug(slug, { preview: true })
  if (!pkg) return { title: 'Package' }
  const title = `${pkg.name_ar} | ${pkg.name_en}`
  const description =
    [pkg.description_ar, pkg.description_en].filter(Boolean).join(' ') ||
    `${pkg.name_ar} — ${SITE_NAME}`
  const url = `${SITE_URL}/packages/${slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
    },
  }
}

export default async function PackageDetailPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const preview = sp.preview === '1'
  const pkg = await getExperiencePackageBySlug(slug, { preview })
  if (!pkg) notFound()

  if (!preview && !pkg.id.startsWith('fallback-')) {
    void incrementPackageStat(pkg.id, 'views_count')
  }

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        {preview && (
          <div className="bg-amber-500/15 px-4 py-2 text-center text-sm font-medium text-amber-900">
            Preview mode — draft/hidden packages visible to admin
          </div>
        )}
        <PackageDetail pkg={pkg} />
      </main>
      <SiteFooter />
    </div>
  )
}
