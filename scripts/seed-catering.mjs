/**
 * Seed Event Catering sections + packages.
 * Usage: node --env-file=.env.local scripts/seed-catering.mjs
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL missing')
  process.exit(1)
}

const sql = neon(url)

const sections = [
  {
    slug: 'official',
    name_ar: 'ضيافة رسمية',
    name_en: 'Official hospitality',
    description_ar: 'للجهات الحكومية والاجتماعات الرسمية',
    description_en: 'For government entities and official meetings',
    sort_order: 1,
  },
  {
    slug: 'corporate',
    name_ar: 'ضيافة شركات',
    name_en: 'Corporate hospitality',
    description_ar: 'للاجتماعات والفعاليات المؤسسية',
    description_en: 'For corporate meetings and events',
    sort_order: 2,
  },
  {
    slug: 'openings',
    name_ar: 'افتتاحات ومناسبات',
    name_en: 'Openings & occasions',
    description_ar: 'للافتتاحات والمناسبات الخاصة',
    description_en: 'For openings and special occasions',
    sort_order: 3,
  },
]

/** hours_per_visit = service hours, visits_per_week/month = guest count */
const packages = [
  {
    section: 'official',
    name_ar: 'باقة استقبال رسمي',
    name_en: 'Official Reception',
    hours: 3,
    guests: 25,
    price: '85.00',
    popular: false,
    sort: 1,
  },
  {
    section: 'official',
    name_ar: 'باقة اجتماعات حكومية',
    name_en: 'Government Meetings',
    hours: 4,
    guests: 50,
    price: '145.00',
    popular: true,
    sort: 2,
  },
  {
    section: 'official',
    name_ar: 'باقة مؤتمر مصغّر',
    name_en: 'Mini Conference',
    hours: 6,
    guests: 100,
    price: '280.00',
    popular: false,
    sort: 3,
  },
  {
    section: 'corporate',
    name_ar: 'باقة ضيافة مكتبية',
    name_en: 'Office Hospitality',
    hours: 3,
    guests: 30,
    price: '95.00',
    popular: false,
    sort: 4,
  },
  {
    section: 'corporate',
    name_ar: 'باقة ورشة عمل',
    name_en: 'Workshop Package',
    hours: 5,
    guests: 75,
    price: '210.00',
    popular: true,
    sort: 5,
  },
  {
    section: 'corporate',
    name_ar: 'باقة فعالية شركات',
    name_en: 'Corporate Event',
    hours: 8,
    guests: 150,
    price: '420.00',
    popular: false,
    sort: 6,
  },
  {
    section: 'openings',
    name_ar: 'باقة افتتاح أنيق',
    name_en: 'Elegant Opening',
    hours: 5,
    guests: 80,
    price: '250.00',
    popular: true,
    sort: 7,
  },
  {
    section: 'openings',
    name_ar: 'باقة مناسبة كبرى',
    name_en: 'Grand Occasion',
    hours: 8,
    guests: 200,
    price: '650.00',
    popular: false,
    sort: 8,
  },
  {
    section: 'official',
    name_ar: 'باقة ضيافة صباحية',
    name_en: 'Morning Hospitality',
    hours: 2,
    guests: 40,
    price: '110.00',
    popular: false,
    sort: 9,
  },
  {
    section: 'corporate',
    name_ar: 'باقة قهوة واستقبال',
    name_en: 'Coffee Reception',
    hours: 3,
    guests: 60,
    price: '130.00',
    popular: false,
    sort: 10,
  },
  {
    section: 'openings',
    name_ar: 'باقة حفل توقيع',
    name_en: 'Signing Ceremony',
    hours: 4,
    guests: 120,
    price: '320.00',
    popular: false,
    sort: 11,
  },
]

async function main() {
  console.log('Deactivating legacy packages…')
  await sql`UPDATE packages SET is_active = false, updated_at = NOW()`

  console.log('Upserting sections…')
  const sectionIds = {}
  for (const s of sections) {
    const rows = await sql`
      INSERT INTO package_sections (slug, name_ar, name_en, description_ar, description_en, sort_order, is_active, updated_at)
      VALUES (${s.slug}, ${s.name_ar}, ${s.name_en}, ${s.description_ar}, ${s.description_en}, ${s.sort_order}, true, NOW())
      ON CONFLICT (slug) DO UPDATE SET
        name_ar = EXCLUDED.name_ar,
        name_en = EXCLUDED.name_en,
        description_ar = EXCLUDED.description_ar,
        description_en = EXCLUDED.description_en,
        sort_order = EXCLUDED.sort_order,
        is_active = true,
        updated_at = NOW()
      RETURNING id, slug
    `
    sectionIds[s.slug] = rows[0].id
  }

  // Remove previously seeded catering packages by English name to allow re-seed
  const names = packages.map((p) => p.name_en)
  await sql`DELETE FROM packages WHERE name_en = ANY(${names})`

  console.log('Inserting catering packages…')
  for (const p of packages) {
    await sql`
      INSERT INTO packages (
        section_id, name_ar, name_en,
        hours_per_visit, visits_per_week, visits_per_month,
        price_omr, is_active, is_popular, is_featured, sort_order, updated_at
      ) VALUES (
        ${sectionIds[p.section]}, ${p.name_ar}, ${p.name_en},
        ${p.hours}, ${p.guests}, ${p.guests},
        ${p.price}, true, ${p.popular}, ${p.popular}, ${p.sort}, NOW()
      )
    `
  }

  const active = await sql`SELECT COUNT(*)::int AS c FROM packages WHERE is_active = true`
  console.log(`Done. Active packages: ${active[0].c}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
