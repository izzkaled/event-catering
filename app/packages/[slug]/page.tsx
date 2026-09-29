import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PackageDetail } from '@/components/packages/package-detail'
import { PackageViewBeacon } from '@/components/packages/package-view-beacon'
import { JsonLdPackage } from '@/components/seo/json-ld-package'
import {
  getPublishedPackageBySlugCached,
  STOREFRONT_REVALIDATE_SECONDS,
} from '@/lib/cache/storefront'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

export const revalidate = STOREFRONT_REVALIDATE_SECONDS

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pkg = await getPublishedPackageBySlugCached(slug)
  if (!pkg) return { title: 'Package' }
  const title = `${pkg.name_ar} | ${pkg.name_en}`
  const description =
    [pkg.description_ar, pkg.description_en].filter(Boolean).join(' ') ||
    `${pkg.name_ar} — ${SITE_NAME}`
  const url = `${SITE_URL}/packages/${slug}`
  return {
    title,
    description,
    keywords: [pkg.name_ar, pkg.name_en, 'ضيافة', 'كاترينج', 'Event Catering Oman', SITE_NAME],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: pkg.cover_image
        ? [
            {
              url: pkg.cover_image.startsWith('http')
                ? pkg.cover_image
                : `${SITE_URL}${pkg.cover_image.startsWith('/') ? '' : '/'}${pkg.cover_image}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PackageDetailPage({ params }: Props) {
  const { slug } = await params
  const pkg = await getPublishedPackageBySlugCached(slug)
  if (!pkg) notFound()

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <JsonLdPackage
        pkg={{
          slug,
          name_ar: pkg.name_ar,
          name_en: pkg.name_en,
          description_ar: pkg.description_ar,
          description_en: pkg.description_en,
          price_omr: pkg.price_omr,
          cover_image: pkg.cover_image,
        }}
      />
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <PackageDetail pkg={pkg} />
      </main>
      <SiteFooter />
      <PackageViewBeacon packageId={pkg.id} />
    </div>
  )
}
