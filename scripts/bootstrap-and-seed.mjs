/**
 * Bootstrap full Event Catering schema on a fresh Neon DB, then seed packages.
 * Usage: $env:NODE_TLS_REJECT_UNAUTHORIZED='0'; node --env-file=.env.local scripts/bootstrap-and-seed.mjs
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL missing')
  process.exit(1)
}

const sql = neon(url)

async function bootstrap() {
  console.log('Creating schema…')

  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`

  await sql`
    CREATE TABLE IF NOT EXISTS package_sections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug text UNIQUE NOT NULL,
      name_ar text NOT NULL,
      name_en text NOT NULL,
      description_ar text,
      description_en text,
      sort_order integer DEFAULT 0 NOT NULL,
      is_active boolean DEFAULT true NOT NULL,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS packages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id uuid REFERENCES package_sections(id),
      name_ar text NOT NULL,
      name_en text NOT NULL,
      hours_per_visit integer NOT NULL,
      visits_per_week integer NOT NULL,
      visits_per_month integer NOT NULL,
      price_omr numeric(10, 2) NOT NULL,
      is_active boolean DEFAULT true NOT NULL,
      is_popular boolean DEFAULT false NOT NULL,
      is_featured boolean DEFAULT false,
      sort_order integer DEFAULT 0,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS packages_section_id_idx ON packages(section_id)`

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_user_id text UNIQUE,
      phone text UNIQUE,
      name text,
      email text,
      address text,
      area text,
      role text DEFAULT 'user' NOT NULL,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number text UNIQUE NOT NULL,
      user_id uuid REFERENCES users(id),
      customer_name text NOT NULL,
      customer_phone text NOT NULL,
      customer_email text,
      customer_address text NOT NULL,
      customer_area text NOT NULL,
      notes text,
      package_id uuid REFERENCES packages(id),
      package_name_ar text,
      package_name_en text,
      hours_per_visit integer NOT NULL,
      visits_per_week integer NOT NULL,
      visits_per_month integer NOT NULL,
      price_omr numeric(10, 2) NOT NULL,
      commission_omr numeric(10, 2) NOT NULL,
      net_revenue_omr numeric(10, 2) NOT NULL,
      start_date date NOT NULL,
      end_date date,
      preferred_time text NOT NULL,
      preferred_days text[] NOT NULL,
      status text DEFAULT 'pending' NOT NULL,
      payment_method text DEFAULT 'bank_transfer' NOT NULL,
      payment_status text DEFAULT 'unpaid' NOT NULL,
      stripe_checkout_session_id text,
      paymob_intention_id text,
      paymob_transaction_id text,
      payment_reference text,
      paid_at timestamp,
      refund_status text,
      refund_amount_omr numeric(10, 2),
      invoice_url text,
      transfer_receipt_url text,
      verification_notes text,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status)`
  await sql`CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status)`
  await sql`CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at)`

  await sql`
    CREATE TABLE IF NOT EXISTS site_visits (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      page text DEFAULT '/' NOT NULL,
      visitor_id text,
      created_at timestamp DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS site_visits_created_at_idx ON site_visits(created_at)`

  await sql`
    CREATE TABLE IF NOT EXISTS admin_notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid REFERENCES orders(id),
      message text NOT NULL,
      is_read boolean DEFAULT false,
      created_at timestamp DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS schedule_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      type text DEFAULT 'event' NOT NULL,
      start_at timestamp NOT NULL,
      end_at timestamp NOT NULL,
      created_at timestamp DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      phone text NOT NULL,
      code_hash text NOT NULL,
      expires_at timestamp NOT NULL,
      attempts integer DEFAULT 0 NOT NULL,
      created_at timestamp DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS otp_codes_phone_idx ON otp_codes(phone)`

  await sql`
    CREATE TABLE IF NOT EXISTS email_collections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS email_contacts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      collection_id uuid NOT NULL REFERENCES email_collections(id) ON DELETE CASCADE,
      email text NOT NULL,
      company_name text,
      notes text,
      created_at timestamp DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS email_contacts_collection_id_idx ON email_contacts(collection_id)`
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS email_contacts_collection_email_uidx
    ON email_contacts(collection_id, email)
  `

  console.log('Schema ready.')
}

async function seed() {
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

  const packages = [
    { section: 'official', name_ar: 'باقة استقبال رسمي', name_en: 'Official Reception', hours: 3, guests: 25, price: '85.00', popular: false, sort: 1 },
    { section: 'official', name_ar: 'باقة اجتماعات حكومية', name_en: 'Government Meetings', hours: 4, guests: 50, price: '145.00', popular: true, sort: 2 },
    { section: 'official', name_ar: 'باقة مؤتمر مصغّر', name_en: 'Mini Conference', hours: 6, guests: 100, price: '280.00', popular: false, sort: 3 },
    { section: 'corporate', name_ar: 'باقة ضيافة مكتبية', name_en: 'Office Hospitality', hours: 3, guests: 30, price: '95.00', popular: false, sort: 4 },
    { section: 'corporate', name_ar: 'باقة ورشة عمل', name_en: 'Workshop Package', hours: 5, guests: 75, price: '210.00', popular: true, sort: 5 },
    { section: 'corporate', name_ar: 'باقة فعالية شركات', name_en: 'Corporate Event', hours: 8, guests: 150, price: '420.00', popular: false, sort: 6 },
    { section: 'openings', name_ar: 'باقة افتتاح أنيق', name_en: 'Elegant Opening', hours: 5, guests: 80, price: '250.00', popular: true, sort: 7 },
    { section: 'openings', name_ar: 'باقة مناسبة كبرى', name_en: 'Grand Occasion', hours: 8, guests: 200, price: '650.00', popular: false, sort: 8 },
  ]

  console.log('Seeding sections & packages…')
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

  const names = packages.map((p) => p.name_en)
  await sql`DELETE FROM packages WHERE name_en = ANY(${names})`

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

await bootstrap()
await seed()
