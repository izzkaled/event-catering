/** Shared SEO copy for Event Catering (Arabic + English). */

/** Production canonical host (override with NEXT_PUBLIC_SITE_URL). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://event-catering-om.netlify.app'
).replace(/\/$/, '')

export const SITE_NAME_AR = 'إيفنت كاترينج'
export const SITE_NAME_EN = 'Event Catering'
export const SITE_NAME = 'Event Catering | إيفنت كاترينج'

export const SEO_TITLE_AR =
  'إيفنت كاترينج | باقات ضيافة وتصميم تجربة للمناسبات في عُمان'
export const SEO_TITLE_EN =
  'Event Catering | Hospitality Packages & Experience Design in Oman'

/** Default browser tab / Google snippet title (bilingual, brand first). */
export const SEO_TITLE_DEFAULT =
  'Event Catering | ضيافة بالباقات — جهات حكومية وشركات في عُمان'

export const SEO_DESCRIPTION_AR =
  'إيفنت كاترينج منصة ضيافة بالباقات في عُمان. تصفّح الباقات، خصّص تجربتك حسب الضيوف والموعد والخدمات، وأرسل طلباً ننسّقه مع مزوّدي الضيافة للمناسبات الرسمية والاجتماعات والشركات.'

export const SEO_DESCRIPTION_EN =
  'Event Catering is a hospitality packages platform in Oman. Browse packages, customize guests, schedule and services, then submit a request we coordinate with catering partners for official, corporate and private events.'

/** Combined for meta description. */
export const SEO_DESCRIPTION = `${SEO_DESCRIPTION_AR} ${SEO_DESCRIPTION_EN}`

export const SEO_KEYWORDS = [
  'إيفنت كاترينج',
  'Event Catering',
  'event-catering-om',
  'ضيافة عمان',
  'باقات ضيافة مسقط',
  'ضيافة جهات حكومية',
  'ضيافة شركات عُمان',
  'تصميم تجربة ضيافة',
  'كاترينج مناسبات مسقط',
  'hospitality packages Oman',
  'corporate catering Muscat',
  'government event catering Oman',
  'customize catering experience',
  'ضيافة مؤتمرات',
  'ضيافة افتتاح',
  'ضيافة اجتماعات',
]

export const OG_IMAGE = '/images/brand/brand-table.webp'
