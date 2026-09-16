import {
  SEO_DESCRIPTION_AR,
  SEO_DESCRIPTION_EN,
  SITE_NAME,
  SITE_NAME_AR,
  SITE_NAME_EN,
  SITE_URL,
} from '@/lib/seo'

/** LocalBusiness + Organization JSON-LD for Google (AR + EN). */
export function JsonLdBusiness() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: [SITE_NAME_AR, SITE_NAME_EN, 'Event Catering Oman'],
        url: SITE_URL,
        logo: `${SITE_URL}/images/brand/logo-mark.webp`,
        email: 'izzkaled@gmail.com',
        telephone: '+96877222432',
        sameAs: [`https://wa.me/96877222432`],
        areaServed: {
          '@type': 'City',
          name: 'Muscat',
          containedInPlace: { '@type': 'Country', name: 'Oman' },
        },
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#localbusiness`,
        name: SITE_NAME,
        alternateName: [SITE_NAME_AR, SITE_NAME_EN],
        description: `${SEO_DESCRIPTION_AR} ${SEO_DESCRIPTION_EN}`,
        url: SITE_URL,
        image: `${SITE_URL}/images/brand/brand-table.webp`,
        telephone: '+96877222432',
        email: 'izzkaled@gmail.com',
        priceRange: 'OMR',
        currenciesAccepted: 'OMR',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Muscat',
          addressCountry: 'OM',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 23.588,
          longitude: 58.3829,
        },
        areaServed: [
          'Muscat',
          'Muttrah',
          'Bawshar',
          'Al Amarat',
          'Seeb',
          'Qurayyat',
        ],
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Saturday',
          ],
          opens: '08:00',
          closes: '20:00',
        },
        parentOrganization: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: ['ar', 'en'],
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/packages?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        hasPart: [
          { '@type': 'WebPage', name: 'Packages', url: `${SITE_URL}/packages` },
          { '@type': 'WebPage', name: 'Find experience', url: `${SITE_URL}/experience/find` },
          { '@type': 'WebPage', name: 'FAQ', url: `${SITE_URL}/faq` },
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
