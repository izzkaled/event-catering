/**
 * Dynamic package management schema + seed categories/services + backfill packages.
 * Usage: node --env-file=.env.local scripts/migrate-dynamic-packages.mjs
 */
import { neon } from '@neondatabase/serverless'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL missing')
  process.exit(1)
}

const sql = neon(url)

async function addCol(table, def) {
  try {
    await sql.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${def}`)
    console.log('+', table, def.split(' ')[0])
  } catch (e) {
    console.warn('skip', table, def.split(' ')[0], e.message)
  }
}

await addCol('packages', 'slug text')
await addCol('packages', 'short_description_ar text')
await addCol('packages', 'short_description_en text')
await addCol('packages', 'description_ar text')
await addCol('packages', 'description_en text')
await addCol('packages', "occasion_types text[] NOT NULL DEFAULT '{}'")
await addCol('packages', "pricing_model text NOT NULL DEFAULT 'starting_from'")
await addCol('packages', 'min_guests integer')
await addCol('packages', 'max_guests integer')
await addCol('packages', 'per_guest_omr numeric(10,2)')
await addCol('packages', 'cover_image text')
await addCol('packages', "gallery text[] NOT NULL DEFAULT '{}'")
await addCol('packages', "features_ar text[] NOT NULL DEFAULT '{}'")
await addCol('packages', "features_en text[] NOT NULL DEFAULT '{}'")
await addCol('packages', "status text NOT NULL DEFAULT 'published'")
await addCol('packages', 'is_recommended boolean NOT NULL DEFAULT false')
await addCol('packages', 'is_new boolean NOT NULL DEFAULT false')
await addCol('packages', 'is_best_value boolean NOT NULL DEFAULT false')
await addCol('packages', 'views_count integer NOT NULL DEFAULT 0')
await addCol('packages', 'customizations_count integer NOT NULL DEFAULT 0')
await addCol('packages', 'requests_count integer NOT NULL DEFAULT 0')
await addCol('packages', 'bookings_count integer NOT NULL DEFAULT 0')

await sql`
CREATE TABLE IF NOT EXISTS package_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  kind text NOT NULL DEFAULT 'occasion',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)`

await sql`
CREATE TABLE IF NOT EXISTS hospitality_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text,
  description_en text,
  category text NOT NULL,
  price_omr numeric(10,2) NOT NULL,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)`

await addCol('hospitality_services', 'is_archived boolean NOT NULL DEFAULT false')

await sql`
CREATE TABLE IF NOT EXISTS package_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES hospitality_services(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'included',
  included boolean NOT NULL DEFAULT true,
  quantity integer NOT NULL DEFAULT 1,
  custom_price_omr numeric(10,2),
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (package_id, service_id)
)`

await addCol('package_services', "role text NOT NULL DEFAULT 'included'")
await addCol('package_services', 'sort_order integer NOT NULL DEFAULT 0')

await sql`
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp DEFAULT now()
)`

await sql`
CREATE TABLE IF NOT EXISTS saved_experiences (
  id text PRIMARY KEY,
  package_id uuid REFERENCES packages(id),
  payload text NOT NULL,
  estimated_total_omr numeric(10,2),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)`

await sql`CREATE UNIQUE INDEX IF NOT EXISTS packages_slug_uidx ON packages(slug) WHERE slug IS NOT NULL`
await sql`CREATE INDEX IF NOT EXISTS packages_status_idx ON packages(status)`

const categories = [
  ['corporate', 'شركات', 'Corporate', 1],
  ['government', 'جهات حكومية', 'Government', 2],
  ['private', 'مناسبات خاصة', 'Private', 3],
  ['wedding', 'أعراس', 'Wedding', 4],
  ['meeting', 'اجتماعات', 'Meeting', 5],
  ['celebration', 'حفلات', 'Celebration', 6],
  ['events', 'فعاليات', 'Event', 7],
  ['large', 'مناسبات كبيرة', 'Large occasions', 8],
  ['custom', 'مخصص', 'Custom', 9],
]

for (const [slug, ar, en, order] of categories) {
  await sql`
    INSERT INTO package_categories (slug, name_ar, name_en, kind, sort_order)
    VALUES (${slug}, ${ar}, ${en}, 'occasion', ${order})
    ON CONFLICT (slug) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en, sort_order = EXCLUDED.sort_order
  `
}

await sql`
  INSERT INTO site_settings (key, value) VALUES ('max_featured_packages', '3')
  ON CONFLICT (key) DO NOTHING
`

const services = [
  ['arabic-coffee', 'خدمة القهوة العربية', 'Arabic Coffee Service', 'Traditional Arabic coffee.', 'قهوة عربية تقليدية.', 'food_beverage', 45, 1],
  ['tea', 'خدمة الشاي', 'Tea Service', 'Refined tea selection.', 'تشكيلة شاي.', 'food_beverage', 25, 2],
  ['dates', 'تمور ومقبلات خفيفة', 'Dates & Light Bites', 'Premium dates and bites.', 'تمور ومقبلات.', 'food_beverage', 30, 3],
  ['water', 'مياه ومشروبات باردة', 'Water & Soft Drinks', 'Water and soft drinks.', 'مياه ومشروبات.', 'food_beverage', 20, 4],
  ['juices', 'عصائر طازجة', 'Fresh Juices', 'Fresh juice station.', 'محطة عصائر.', 'food_beverage', 55, 5],
  ['desserts', 'محطة حلويات', 'Dessert Station', 'Elegant desserts.', 'حلويات أنيقة.', 'food_beverage', 75, 6],
  ['canapes', 'كانابيهات', 'Canapés', 'Refined canapés.', 'مقبلات راقية.', 'food_beverage', 90, 7],
  ['buffet', 'بوفيه', 'Buffet', 'Flexible buffet.', 'بوفيه مرن.', 'food_beverage', 150, 8],
  ['tables', 'طاولات', 'Tables', 'Tables for the layout.', 'طاولات مناسبة.', 'setup', 40, 9],
  ['chairs', 'كراسي', 'Chairs', 'Seating for guests.', 'كراسي للضيوف.', 'setup', 35, 10],
  ['serving-station', 'محطة تقديم', 'Serving Station', 'Organized serving station.', 'محطة تقديم.', 'setup', 50, 11],
  ['decorative-setup', 'تجهيز ديكوري', 'Decorative Setup', 'Elegant decor touches.', 'ديكور أنيق.', 'setup', 80, 12],
  ['welcome-area', 'منطقة ترحيب', 'Welcome Area', 'Clear welcome area.', 'منطقة استقبال.', 'setup', 60, 13],
  ['servers', 'طاقم تقديم', 'Servers', 'Professional servers.', 'طاقم تقديم.', 'staff', 70, 14],
  ['hosts', 'مستقبلون', 'Hosts', 'Hosts for guests.', 'فريق استقبال.', 'staff', 55, 15],
  ['supervisors', 'مشرفون', 'Supervisors', 'On-site supervision.', 'إشراف ميداني.', 'staff', 65, 16],
  ['event-staff', 'طاقم فعالية', 'Event Staff', 'Extra event support.', 'دعم تشغيلي.', 'staff', 90, 17],
  ['welcome-team', 'فريق ترحيب', 'Welcome Team', 'Dedicated welcome team.', 'فريق ترحيب.', 'additional', 40, 18],
  ['cleaning', 'تنظيف بعد المناسبة', 'Post-event Cleaning', 'Post-event tidy-up.', 'تنظيف بعد المناسبة.', 'additional', 50, 19],
  ['transportation', 'نقل وتوصيل', 'Transportation', 'Transport for setup/staff.', 'نقل التجهيزات.', 'additional', 45, 20],
  ['special-requests', 'طلبات خاصة', 'Special Requests', 'Custom extras.', 'تفاصيل إضافية.', 'additional', 35, 21],
]

for (const [slug, ar, en, descEn, descAr, cat, price, order] of services) {
  await sql`
    INSERT INTO hospitality_services (slug, name_ar, name_en, description_ar, description_en, category, price_omr, sort_order)
    VALUES (${slug}, ${ar}, ${en}, ${descAr}, ${descEn}, ${cat}, ${price}, ${order})
    ON CONFLICT (slug) DO UPDATE SET
      name_ar = EXCLUDED.name_ar,
      name_en = EXCLUDED.name_en,
      description_ar = EXCLUDED.description_ar,
      description_en = EXCLUDED.description_en,
      category = EXCLUDED.category,
      price_omr = EXCLUDED.price_omr,
      sort_order = EXCLUDED.sort_order
  `
}

// Backfill package metadata from existing rows
const pkgs = await sql`SELECT id, name_en, name_ar, visits_per_week, price_omr, section_id, is_popular, is_recommended FROM packages`
const sections = await sql`SELECT id, slug FROM package_sections`
const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s.slug]))

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const metaByName = {
  'Official Reception': { occasions: ['government', 'meeting'], features_en: ['Welcome drinks', 'Arabic coffee', 'Dates', 'Service staff'], features_ar: ['مشروبات ترحيب', 'قهوة عربية', 'تمور', 'طاقم تقديم'], services: ['arabic-coffee', 'dates', 'tea', 'servers'] },
  'Government Meetings': { occasions: ['government', 'meeting'], features_en: ['Arabic coffee', 'Tea', 'Dates', 'Serving station'], features_ar: ['قهوة عربية', 'شاي', 'تمور', 'محطة تقديم'], services: ['arabic-coffee', 'tea', 'dates', 'serving-station', 'supervisors'] },
  'Mini Conference': { occasions: ['government', 'events', 'corporate'], features_en: ['Beverages', 'Canapés', 'Event staff'], features_ar: ['مشروبات', 'كانابيهات', 'طاقم فعالية'], services: ['arabic-coffee', 'water', 'canapes', 'serving-station', 'event-staff'] },
  'Office Hospitality': { occasions: ['corporate', 'meeting'], features_en: ['Coffee', 'Tea', 'Water', 'Service staff'], features_ar: ['قهوة', 'شاي', 'مياه', 'طاقم تقديم'], services: ['arabic-coffee', 'tea', 'water', 'servers'] },
  'Workshop Package': { occasions: ['corporate', 'meeting'], features_en: ['Beverages', 'Light bites', 'Serving station'], features_ar: ['مشروبات', 'مقبلات خفيفة', 'محطة تقديم'], services: ['tea', 'water', 'dates', 'serving-station'] },
  'Corporate Event': { occasions: ['corporate', 'events', 'celebration'], features_en: ['Welcome drinks', 'Canapés', 'Servers', 'Decor'], features_ar: ['مشروبات ترحيب', 'كانابيهات', 'طاقم تقديم', 'ديكور'], services: ['arabic-coffee', 'canapes', 'servers', 'welcome-area', 'decorative-setup'] },
  'Elegant Opening': { occasions: ['private', 'celebration', 'events'], features_en: ['Welcome', 'Desserts', 'Decor', 'Hosts'], features_ar: ['ترحيب', 'حلويات', 'ديكور', 'مستقبلون'], services: ['welcome-team', 'desserts', 'decorative-setup', 'hosts'] },
  'Grand Occasion': { occasions: ['large', 'events', 'celebration'], features_en: ['Buffet', 'Event staff', 'Supervision'], features_ar: ['بوفيه', 'طاقم فعالية', 'إشراف'], services: ['buffet', 'event-staff', 'serving-station', 'supervisors', 'cleaning'] },
  'Morning Hospitality': { occasions: ['meeting', 'corporate', 'government'], features_en: ['Coffee', 'Tea', 'Dates', 'Water'], features_ar: ['قهوة', 'شاي', 'تمور', 'مياه'], services: ['arabic-coffee', 'tea', 'dates', 'water'] },
  'Coffee Reception': { occasions: ['corporate', 'meeting', 'private'], features_en: ['Arabic coffee', 'Tea', 'Dates', 'Service staff'], features_ar: ['قهوة عربية', 'شاي', 'تمور', 'طاقم تقديم'], services: ['arabic-coffee', 'tea', 'dates', 'servers'] },
  'Signing Ceremony': { occasions: ['government', 'corporate', 'events'], features_en: ['Welcome', 'Coffee', 'Canapés', 'Hosts'], features_ar: ['ترحيب', 'قهوة', 'مقبلات', 'مستقبلون'], services: ['welcome-team', 'arabic-coffee', 'canapes', 'hosts', 'decorative-setup'] },
}

const allServices = await sql`SELECT id, slug FROM hospitality_services`
const serviceIdBySlug = Object.fromEntries(allServices.map((s) => [s.slug, s.id]))

for (const pkg of pkgs) {
  const slug = slugify(pkg.name_en)
  const guests = Number(pkg.visits_per_week) || 50
  const sectionSlug = sectionMap[pkg.section_id] || 'corporate'
  const meta = metaByName[pkg.name_en] || {
    occasions: sectionSlug === 'official' ? ['government'] : sectionSlug === 'openings' ? ['private', 'events'] : ['corporate'],
    features_en: ['Welcome drinks', 'Arabic coffee', 'Service staff'],
    features_ar: ['مشروبات ترحيب', 'قهوة عربية', 'طاقم تقديم'],
    services: ['arabic-coffee', 'tea', 'servers'],
  }
  const minG = Math.max(10, Math.round(guests * 0.6))
  const maxG = Math.max(guests, Math.round(guests * 1.4))
  const perGuest = Math.max(1.5, Number(pkg.price_omr) / Math.max(guests, 1) / 2)

  await sql`
    UPDATE packages SET
      slug = COALESCE(NULLIF(slug, ''), ${slug}),
      short_description_ar = COALESCE(short_description_ar, ${'تجربة ضيافة قابلة للتخصيص تناسب مناسبتك.'}),
      short_description_en = COALESCE(short_description_en, ${'A customizable hospitality experience for your occasion.'}),
      description_ar = COALESCE(description_ar, ${'أخبرنا عن مناسبتك وعدد ضيوفك، وسنساعدك في بناء التجربة المناسبة.'}),
      description_en = COALESCE(description_en, ${'Tell us about your occasion and guests — we’ll help you build the right experience.'}),
      occasion_types = ${meta.occasions},
      pricing_model = COALESCE(NULLIF(pricing_model, ''), 'starting_from'),
      min_guests = COALESCE(min_guests, ${minG}),
      max_guests = COALESCE(max_guests, ${maxG}),
      per_guest_omr = COALESCE(per_guest_omr, ${perGuest}),
      cover_image = COALESCE(cover_image, ${'/images/brand/brand-table.webp'}),
      gallery = CASE WHEN gallery IS NULL OR cardinality(gallery) = 0 THEN ${['/images/brand/brand-table.webp', '/images/brand/brand-uniform.webp']} ELSE gallery END,
      features_ar = CASE WHEN features_ar IS NULL OR cardinality(features_ar) = 0 THEN ${meta.features_ar} ELSE features_ar END,
      features_en = CASE WHEN features_en IS NULL OR cardinality(features_en) = 0 THEN ${meta.features_en} ELSE features_en END,
      status = COALESCE(NULLIF(status, ''), 'published'),
      updated_at = now()
    WHERE id = ${pkg.id}
  `

  let sort = 0
  for (const svcSlug of meta.services) {
    const sid = serviceIdBySlug[svcSlug]
    if (!sid) continue
    await sql`
      INSERT INTO package_services (package_id, service_id, role, included, sort_order)
      VALUES (${pkg.id}, ${sid}, 'included', true, ${sort})
      ON CONFLICT (package_id, service_id) DO UPDATE SET role = 'included', included = true
    `
    sort += 1
  }
}

console.log('Dynamic package management migration complete. Packages:', pkgs.length)
