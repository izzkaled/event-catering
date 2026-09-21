import {
  SEO_DESCRIPTION_AR,
  SITE_NAME,
  SITE_NAME_AR,
  SITE_NAME_EN,
  SITE_URL,
} from '@/lib/seo'

const AREA_OMAN = { '@type': 'Country' as const, name: 'Oman' }

const CITIES = [
  'Muscat',
  'Muttrah',
  'Bawshar',
  'Al Amarat',
  'Seeb',
  'Qurayyat',
  'Salalah',
  'Sohar',
  'Nizwa',
  'Sur',
  'Ibri',
  'Barka',
]

/** LocalBusiness + Organization + Service JSON-LD for broader Google eligibility. */
export function JsonLdBusiness() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: [
          SITE_NAME_AR,
          SITE_NAME_EN,
          'Event Catering Oman',
          'إيفنت كاترينج عُمان',
          'كاترينج مناسبات عمان',
        ],
        url: SITE_URL,
        logo: `${SITE_URL}/images/brand/logo-mark.webp`,
        email: 'izzkaled@gmail.com',
        telephone: '+96877222432',
        sameAs: ['https://www.event-om.com', 'https://wa.me/96877222432'],
        areaServed: AREA_OMAN,
        knowsAbout: [
          'Event catering',
          'Hospitality packages',
          'Corporate catering',
          'Government event catering',
          'Conference catering',
          'كاترينج مناسبات',
          'ضيافة شركات',
          'ضيافة جهات حكومية',
        ],
      },
      {
        '@type': ['LocalBusiness', 'FoodEstablishment'],
        '@id': `${SITE_URL}/#localbusiness`,
        name: SITE_NAME,
        alternateName: [SITE_NAME_AR, SITE_NAME_EN],
        description: SEO_DESCRIPTION_AR,
        url: SITE_URL,
        image: `${SITE_URL}/images/brand/brand-table.webp`,
        telephone: '+96877222432',
        email: 'izzkaled@gmail.com',
        priceRange: 'OMR',
        currenciesAccepted: 'OMR',
        servesCuisine: ['Arabic', 'Omani', 'International'],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Muscat',
          addressRegion: 'Muscat',
          addressCountry: 'OM',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 23.588,
          longitude: 58.3829,
        },
        areaServed: [AREA_OMAN, ...CITIES.map((name) => ({ '@type': 'City', name }))],
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
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'باقات كاترينج وضيافة',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'ضيافة جهات حكومية',
                description: 'كاترينج واجتماعات ومؤتمرات رسمية',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'ضيافة شركات',
                description: 'فعاليات شركات وورش عمل واستقبالات',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'مناسبات وافتتاحات',
                description: 'ضيافة مناسبات خاصة وافتتاحات وحفلات توقيع',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'تخصيص تجربة ضيافة',
                description: 'بناء باقة حسب الضيوف والخدمات والموقع',
              },
            },
          ],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: ['كاترينج عُمان', 'ضيافة مناسبات عُمان'],
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
          { '@type': 'WebPage', name: 'باقات كاترينج وضيافة', url: `${SITE_URL}/packages` },
          { '@type': 'WebPage', name: 'اعثر على تجربتك', url: `${SITE_URL}/experience/find` },
          { '@type': 'WebPage', name: 'أسئلة شائعة', url: `${SITE_URL}/faq` },
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
