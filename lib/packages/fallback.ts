import type { PackageWithSection } from '@/lib/packages/types'

type Seed = {
  id: string
  name_ar: string
  name_en: string
  hours_per_visit: number
  visits_per_week: number
  price_omr: string
  is_popular?: boolean
  is_recommended?: boolean
  sort_order: number
  section_slug: string
  section_name_ar: string
  section_name_en: string
  occasion_types?: string[]
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function pkg(partial: Seed): PackageWithSection {
  const guests = partial.visits_per_week
  return {
    id: partial.id,
    section_id: null,
    slug: slugify(partial.name_en),
    name_ar: partial.name_ar,
    name_en: partial.name_en,
    short_description_ar: 'تجربة ضيافة قابلة للتخصيص تناسب مناسبتك.',
    short_description_en: 'A customizable hospitality experience for your occasion.',
    description_ar: 'أخبرنا عن مناسبتك وعدد ضيوفك، وسنساعدك في بناء التجربة المناسبة.',
    description_en: 'Tell us about your occasion and guests — we’ll help you build the right experience.',
    occasion_types: partial.occasion_types || [partial.section_slug === 'official' ? 'government' : partial.section_slug === 'openings' ? 'private' : 'corporate'],
    pricing_model: 'starting_from',
    hours_per_visit: partial.hours_per_visit,
    visits_per_week: guests,
    visits_per_month: guests,
    min_guests: Math.max(10, Math.round(guests * 0.6)),
    max_guests: Math.max(guests, Math.round(guests * 1.4)),
    per_guest_omr: String(Math.max(1.5, Number(partial.price_omr) / Math.max(guests, 1) / 2)),
    price_omr: partial.price_omr,
    cover_image: '/images/brand/brand-table.webp',
    gallery: ['/images/brand/brand-table.webp', '/images/brand/brand-uniform.webp'],
    features_ar: ['مشروبات ترحيب', 'قهوة عربية', 'تمور', 'طاقم تقديم'],
    features_en: ['Welcome drinks', 'Arabic coffee', 'Dates', 'Service staff'],
    status: 'published',
    is_active: true,
    is_popular: Boolean(partial.is_popular),
    is_featured: Boolean(partial.is_popular),
    is_recommended: Boolean(partial.is_recommended || partial.is_popular),
    is_new: false,
    is_best_value: false,
    views_count: 0,
    customizations_count: 0,
    requests_count: 0,
    bookings_count: 0,
    sort_order: partial.sort_order,
    created_at: null,
    updated_at: null,
    section_slug: partial.section_slug,
    section_name_ar: partial.section_name_ar,
    section_name_en: partial.section_name_en,
  }
}

/** Shown when the database is unreachable — keeps the storefront populated. */
export const FALLBACK_PACKAGES: PackageWithSection[] = [
  pkg({ id: 'fallback-official-25', name_ar: 'باقة استقبال رسمي', name_en: 'Official Reception', hours_per_visit: 3, visits_per_week: 25, price_omr: '85.00', sort_order: 1, section_slug: 'official', section_name_ar: 'ضيافة رسمية', section_name_en: 'Official hospitality', occasion_types: ['government', 'meeting'] }),
  pkg({ id: 'fallback-official-50', name_ar: 'باقة اجتماعات حكومية', name_en: 'Government Meetings', hours_per_visit: 4, visits_per_week: 50, price_omr: '145.00', is_popular: true, is_recommended: true, sort_order: 2, section_slug: 'official', section_name_ar: 'ضيافة رسمية', section_name_en: 'Official hospitality', occasion_types: ['government', 'meeting'] }),
  pkg({ id: 'fallback-official-100', name_ar: 'باقة مؤتمر مصغّر', name_en: 'Mini Conference', hours_per_visit: 6, visits_per_week: 100, price_omr: '280.00', sort_order: 3, section_slug: 'official', section_name_ar: 'ضيافة رسمية', section_name_en: 'Official hospitality', occasion_types: ['government', 'events'] }),
  pkg({ id: 'fallback-corp-30', name_ar: 'باقة ضيافة مكتبية', name_en: 'Office Hospitality', hours_per_visit: 3, visits_per_week: 30, price_omr: '95.00', sort_order: 4, section_slug: 'corporate', section_name_ar: 'ضيافة شركات', section_name_en: 'Corporate hospitality', occasion_types: ['corporate', 'meeting'] }),
  pkg({ id: 'fallback-corp-75', name_ar: 'باقة ورشة عمل', name_en: 'Workshop Package', hours_per_visit: 5, visits_per_week: 75, price_omr: '210.00', is_popular: true, sort_order: 5, section_slug: 'corporate', section_name_ar: 'ضيافة شركات', section_name_en: 'Corporate hospitality', occasion_types: ['corporate', 'meeting'] }),
  pkg({ id: 'fallback-corp-150', name_ar: 'باقة فعالية شركات', name_en: 'Corporate Event', hours_per_visit: 8, visits_per_week: 150, price_omr: '420.00', sort_order: 6, section_slug: 'corporate', section_name_ar: 'ضيافة شركات', section_name_en: 'Corporate hospitality', occasion_types: ['corporate', 'events'] }),
  pkg({ id: 'fallback-open-80', name_ar: 'باقة افتتاح أنيق', name_en: 'Elegant Opening', hours_per_visit: 5, visits_per_week: 80, price_omr: '250.00', is_popular: true, sort_order: 7, section_slug: 'openings', section_name_ar: 'افتتاحات ومناسبات', section_name_en: 'Openings & occasions', occasion_types: ['private', 'celebration'] }),
  pkg({ id: 'fallback-open-200', name_ar: 'باقة مناسبة كبرى', name_en: 'Grand Occasion', hours_per_visit: 8, visits_per_week: 200, price_omr: '650.00', sort_order: 8, section_slug: 'openings', section_name_ar: 'افتتاحات ومناسبات', section_name_en: 'Openings & occasions', occasion_types: ['large', 'events'] }),
  pkg({ id: 'fallback-morning-40', name_ar: 'باقة ضيافة صباحية', name_en: 'Morning Hospitality', hours_per_visit: 2, visits_per_week: 40, price_omr: '110.00', sort_order: 9, section_slug: 'official', section_name_ar: 'ضيافة رسمية', section_name_en: 'Official hospitality', occasion_types: ['meeting'] }),
  pkg({ id: 'fallback-coffee-60', name_ar: 'باقة قهوة واستقبال', name_en: 'Coffee Reception', hours_per_visit: 3, visits_per_week: 60, price_omr: '130.00', sort_order: 10, section_slug: 'corporate', section_name_ar: 'ضيافة شركات', section_name_en: 'Corporate hospitality', occasion_types: ['corporate', 'meeting'] }),
  pkg({ id: 'fallback-signing-120', name_ar: 'باقة حفل توقيع', name_en: 'Signing Ceremony', hours_per_visit: 4, visits_per_week: 120, price_omr: '320.00', sort_order: 11, section_slug: 'openings', section_name_ar: 'افتتاحات ومناسبات', section_name_en: 'Openings & occasions', occasion_types: ['government', 'events'] }),
]
