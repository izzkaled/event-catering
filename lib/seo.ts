/** Shared SEO copy for KHOUSA (Arabic + English search visibility). */

export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.khousa.com').replace(/\/$/, '')

export const SITE_NAME_AR = 'خوصة'
export const SITE_NAME_EN = 'KHOUSA'
export const SITE_NAME = 'خوصة | KHOUSA Oman'

export const SEO_TITLE_AR = 'خوصة | تنظيف منازل في مسقط — باقات شهرية بالريال العُماني'
export const SEO_TITLE_EN =
  'KHOUSA | Home Cleaning in Muscat, Oman — Flexible Monthly Packages'

/** Default browser tab / Google snippet title (bilingual, brand first). */
export const SEO_TITLE_DEFAULT =
  'خوصة | KHOUSA — Home Cleaning in Muscat | تنظيف منازل مسقط'

export const SEO_DESCRIPTION_AR =
  'خوصة خدمة تنظيف منزلي احترافية في مسقط وضواحيها. باقات مرنة من 2 إلى 5 ساعات، زيارات أسبوعية، أسعار شهرية شفافة بالريال العُماني. احجز أونلاين بسهولة.'

export const SEO_DESCRIPTION_EN =
  'KHOUSA is a professional home cleaning service in Muscat, Oman. Flexible packages from 2–5 hours, weekly visits, transparent monthly pricing in OMR. Book online today.'

/** Combined for meta description (Google shows ~150–160 chars; keep brand + locale). */
export const SEO_DESCRIPTION = `${SEO_DESCRIPTION_AR} ${SEO_DESCRIPTION_EN}`

export const SEO_KEYWORDS = [
  'خوصة',
  'KHOUSA',
  'KHOUSA Oman',
  'تنظيف منازل مسقط',
  'تنظيف منزلي عمان',
  'شركة تنظيف مسقط',
  'باقات تنظيف منزلية',
  'home cleaning Muscat',
  'house cleaning Oman',
  'cleaning service Muscat',
  'maid service Muscat',
  'monthly cleaning package Oman',
  'تنظيف بوشهر',
  'تنظيف مطرح',
  'تنظيف العامرات',
]

export const OG_IMAGE = '/images/hero-cleaning.png'
