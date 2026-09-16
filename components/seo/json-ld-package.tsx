import { SITE_NAME, SITE_URL } from '@/lib/seo'

type PackageOfferInput = {
  slug: string
  name_ar: string
  name_en: string
  description_ar?: string | null
  description_en?: string | null
  price_omr: string | number
  cover_image?: string | null
}

/** Product + Offer JSON-LD for package detail pages. */
export function JsonLdPackage({ pkg }: { pkg: PackageOfferInput }) {
  const url = `${SITE_URL}/packages/${pkg.slug}`
  const image = pkg.cover_image
    ? pkg.cover_image.startsWith('http')
      ? pkg.cover_image
      : `${SITE_URL}${pkg.cover_image.startsWith('/') ? '' : '/'}${pkg.cover_image}`
    : `${SITE_URL}/images/brand/brand-table.webp`

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${pkg.name_ar} | ${pkg.name_en}`,
    description:
      [pkg.description_ar, pkg.description_en].filter(Boolean).join(' ') ||
      `${pkg.name_en} hospitality package — ${SITE_NAME}`,
    image,
    url,
    sku: pkg.slug,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'OMR',
      price: String(pkg.price_omr),
      availability: 'https://schema.org/InStock',
      priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10),
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
