/** Shared SEO copy for Event Catering (Arabic + English). */

export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eventcatering.om').replace(/\/$/, '')

export const SITE_NAME_AR = 'إيفنت كاترينج'
export const SITE_NAME_EN = 'Event Catering'
export const SITE_NAME = 'Event Catering | إيفنت كاترينج'

export const SEO_TITLE_AR =
  'إيفنت كاترينج | باقات ضيافة للجهات الحكومية والشركات في عُمان'
export const SEO_TITLE_EN =
  'Event Catering | Hospitality Packages for Government & Corporate Oman'

/** Default browser tab / Google snippet title (bilingual, brand first). */
export const SEO_TITLE_DEFAULT =
  'Event Catering | ضيافة بالباقات — جهات حكومية وشركات'

export const SEO_DESCRIPTION_AR =
  'إيفنت كاترينج منصة وسيط ضيافة بالباقات في عُمان. اختر الباقة وعدد الحضور، ننسّق مع مزوّدي الضيافة ونرد عليك بعرض مناسب للمناسبات الرسمية والاجتماعات.'

export const SEO_DESCRIPTION_EN =
  'Event Catering is a hospitality package intermediary in Oman. Choose a package and guest count — we coordinate catering partners and reply with a tailored offer for official events and meetings.'

/** Combined for meta description. */
export const SEO_DESCRIPTION = `${SEO_DESCRIPTION_AR} ${SEO_DESCRIPTION_EN}`

export const SEO_KEYWORDS = [
  'إيفنت كاترينج',
  'Event Catering',
  'ضيافة عمان',
  'باقات ضيافة',
  'ضيافة جهات حكومية',
  'ضيافة شركات مسقط',
  'كاترينج مناسبات',
  'hospitality packages Oman',
  'corporate catering Muscat',
  'government event catering',
  'catering packages Oman',
  'ضيافة مؤتمرات',
  'ضيافة افتتاح',
]

export const OG_IMAGE = '/images/brand/brand-table.webp'
