/** Shared SEO copy for Event Catering (Arabic + English). */

/** Canonical production origin — always www, never the Netlify default host. */
export const PRODUCTION_SITE_URL = 'https://www.event-om.com'

const LEGACY_PUBLIC_HOSTS = new Set(['event-om.netlify.app', 'event-om.com'])

/** Resolve a public origin and fold aliases onto the canonical www host. */
export function resolvePublicSiteUrl(raw?: string | null): string {
  const fallback = (raw?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || PRODUCTION_SITE_URL).replace(
    /\/$/,
    '',
  )
  try {
    const host = new URL(fallback).hostname.toLowerCase()
    if (LEGACY_PUBLIC_HOSTS.has(host)) return PRODUCTION_SITE_URL
  } catch {
    return PRODUCTION_SITE_URL
  }
  return fallback
}

export const SITE_URL = resolvePublicSiteUrl()

export function absoluteUrl(path = '/'): string {
  if (!path || path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

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
  'Event Catering Oman',
  'event-om',
  'event-om.com',
  'www.event-om.com',
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
  'كاترينج مسقط',
  'طلب ضيافة أونلاين',
  'Muscat catering packages',
]

export const OG_IMAGE = '/images/brand/brand-table.webp'
