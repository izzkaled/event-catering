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

/** Arabic title — multi-intent keywords first, brand last (Oman-wide). */
export const SEO_TITLE_AR = 'كاترينج وضيافة مناسبات عُمان | إيفنت كاترينج'
/** English title — parallel intents for EN queries. */
export const SEO_TITLE_EN = 'Catering & Event Hospitality Oman | Event Catering'

/**
 * Default Google title link.
 * Covers: كاترينج + ضيافة + مناسبات + عُمان (not city-only), brand at end.
 * Kept concise enough to reduce truncation/rewrite while matching more queries.
 */
export const SEO_TITLE_DEFAULT = 'كاترينج وضيافة مناسبات عُمان | إيفنت كاترينج'

export const SEO_DESCRIPTION_AR =
  'كاترينج وضيافة مناسبات في عُمان للجهات الحكومية والشركات والمناسبات الخاصة. اختر باقة أو خصّص تجربتك وأرسل الطلب أونلاين.'

export const SEO_DESCRIPTION_EN =
  'Catering and event hospitality across Oman for government, corporate and private occasions. Choose a package or customize — then submit your request online.'

/**
 * Primary meta description for Oman SERP (Arabic).
 * Two short sentences ≈ 140–155 chars — Google’s practical snippet band.
 */
export const SEO_DESCRIPTION = SEO_DESCRIPTION_AR

/**
 * Broad keyword net for discovery (AR + EN + cities + occasion types).
 * Complements title/description — not a substitute for on-page content.
 */
export const SEO_KEYWORDS = [
  // Brand
  'إيفنت كاترينج',
  'Event Catering',
  'Event Catering Oman',
  'event-om',
  'event-om.com',
  'www.event-om.com',
  // Core AR intents
  'كاترينج عمان',
  'كاترينج عُمان',
  'كاترينج مسقط',
  'ضيافة عمان',
  'ضيافة عُمان',
  'ضيافة مناسبات',
  'ضيافة مناسبات عمان',
  'كاترينج مناسبات',
  'باقات ضيافة',
  'باقات كاترينج',
  'طلب ضيافة أونلاين',
  'تصميم تجربة ضيافة',
  // Audience / occasion AR
  'ضيافة جهات حكومية',
  'ضيافة شركات عُمان',
  'ضيافة شركات مسقط',
  'ضيافة مؤتمرات',
  'ضيافة اجتماعات',
  'ضيافة افتتاح',
  'ضيافة حفل توقيع',
  'ضيافة ورش عمل',
  'بوفيه مناسبات عمان',
  'تموين مناسبات مسقط',
  // Cities / regions AR (nationwide coverage)
  'كاترينج مسقط',
  'كاترينج صلالة',
  'كاترينج صحار',
  'كاترينج نزوى',
  'كاترينج البريمي',
  'ضيافة مسقط',
  'ضيافة صلالة',
  // EN intents
  'catering Oman',
  'event catering Oman',
  'event catering Muscat',
  'hospitality packages Oman',
  'corporate catering Oman',
  'corporate catering Muscat',
  'government event catering Oman',
  'conference catering Oman',
  'meeting catering Muscat',
  'opening ceremony catering Oman',
  'private event catering Oman',
  'customize catering experience',
  'online catering request Oman',
  'catering Salalah',
  'catering Sohar',
]

export const OG_IMAGE = '/images/brand/brand-table.webp'
