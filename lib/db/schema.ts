import {
  pgTable,
  uuid,
  text,
  integer,
  decimal,
  date,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/** Occasion category — official, corporate, openings, etc. */
export const packageSections = pgTable('package_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique().notNull(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  description_ar: text('description_ar'),
  description_en: text('description_en'),
  sort_order: integer('sort_order').default(0).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const packages = pgTable('packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  section_id: uuid('section_id').references(() => packageSections.id),
  slug: text('slug').unique(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  short_description_ar: text('short_description_ar'),
  short_description_en: text('short_description_en'),
  description_ar: text('description_ar'),
  description_en: text('description_en'),
  /** Dynamic occasion/category slugs — drives filters & recommendations */
  occasion_types: text('occasion_types').array().default([]).notNull(),
  /** fixed | per_guest | starting_from | custom_quote */
  pricing_model: text('pricing_model').default('starting_from').notNull(),
  hours_per_visit: integer('hours_per_visit').notNull(), // catering: service hours
  visits_per_week: integer('visits_per_week').notNull(), // catering: default/typical guests
  visits_per_month: integer('visits_per_month').notNull(), // catering: guest capacity mirror
  min_guests: integer('min_guests'),
  max_guests: integer('max_guests'),
  per_guest_omr: decimal('per_guest_omr', { precision: 10, scale: 2 }),
  price_omr: decimal('price_omr', { precision: 10, scale: 2 }).notNull(),
  cover_image: text('cover_image'),
  gallery: text('gallery').array().default([]).notNull(),
  features_ar: text('features_ar').array().default([]).notNull(),
  features_en: text('features_en').array().default([]).notNull(),
  /** published | draft | archived | hidden */
  status: text('status').default('published').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  /** “most popular” badge in storefront */
  is_popular: boolean('is_popular').default(false).notNull(),
  /** @deprecated use is_popular — kept for backward compatibility */
  is_featured: boolean('is_featured').default(false),
  /** Featured / recommended for storefront highlight */
  is_recommended: boolean('is_recommended').default(false).notNull(),
  is_new: boolean('is_new').default(false).notNull(),
  is_best_value: boolean('is_best_value').default(false).notNull(),
  views_count: integer('views_count').default(0).notNull(),
  customizations_count: integer('customizations_count').default(0).notNull(),
  requests_count: integer('requests_count').default(0).notNull(),
  bookings_count: integer('bookings_count').default(0).notNull(),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('packages_section_id_idx').on(table.section_id),
  index('packages_status_idx').on(table.status),
  index('packages_slug_idx').on(table.slug),
])

/** Dynamic filter categories / occasions managed by admin */
export const packageCategories = pgTable('package_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique().notNull(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  /** occasion | filter */
  kind: text('kind').default('occasion').notNull(),
  sort_order: integer('sort_order').default(0).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

/** Catalog of à-la-carte hospitality services for the experience builder. */
export const hospitalityServices = pgTable('hospitality_services', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique().notNull(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  description_ar: text('description_ar'),
  description_en: text('description_en'),
  category: text('category').notNull(),
  price_omr: decimal('price_omr', { precision: 10, scale: 2 }).notNull(),
  image_url: text('image_url'),
  is_active: boolean('is_active').default(true).notNull(),
  is_archived: boolean('is_archived').default(false).notNull(),
  sort_order: integer('sort_order').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const packageServices = pgTable('package_services', {
  id: uuid('id').defaultRandom().primaryKey(),
  package_id: uuid('package_id')
    .notNull()
    .references(() => packages.id, { onDelete: 'cascade' }),
  service_id: uuid('service_id')
    .notNull()
    .references(() => hospitalityServices.id, { onDelete: 'cascade' }),
  /** included | optional | addon | recommended */
  role: text('role').default('included').notNull(),
  included: boolean('included').default(true).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  custom_price_omr: decimal('custom_price_omr', { precision: 10, scale: 2 }),
  sort_order: integer('sort_order').default(0).notNull(),
}, (table) => [
  index('package_services_package_id_idx').on(table.package_id),
  uniqueIndex('package_services_pkg_svc_uidx').on(table.package_id, table.service_id),
])

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const savedExperiences = pgTable('saved_experiences', {
  id: text('id').primaryKey(),
  package_id: uuid('package_id').references(() => packages.id),
  payload: text('payload').notNull(),
  estimated_total_omr: decimal('estimated_total_omr', { precision: 10, scale: 2 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  auth_user_id: text('auth_user_id').unique(),
  phone: text('phone').unique(),
  name: text('name'),
  email: text('email'),
  address: text('address'),
  area: text('area'),
  role: text('role').default('user').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  order_number: text('order_number').unique().notNull(),

  /** Linked account when the customer is logged in (auto-saved on booking). */
  user_id: uuid('user_id').references(() => users.id),

  customer_name: text('customer_name').notNull(),
  customer_phone: text('customer_phone').notNull(),
  customer_email: text('customer_email'),
  customer_address: text('customer_address').notNull(),
  customer_area: text('customer_area').notNull(),
  notes: text('notes'),

  package_id: uuid('package_id').references(() => packages.id),
  package_name_ar: text('package_name_ar'),
  package_name_en: text('package_name_en'),
  hours_per_visit: integer('hours_per_visit').notNull(),
  visits_per_week: integer('visits_per_week').notNull(),
  visits_per_month: integer('visits_per_month').notNull(),

  price_omr: decimal('price_omr', { precision: 10, scale: 2 }).notNull(),
  commission_omr: decimal('commission_omr', { precision: 10, scale: 2 }).notNull(),
  net_revenue_omr: decimal('net_revenue_omr', { precision: 10, scale: 2 }).notNull(),

  start_date: date('start_date').notNull(),
  /** Subscription end (default: one month after start). */
  end_date: date('end_date'),
  preferred_time: text('preferred_time').notNull(),
  preferred_days: text('preferred_days').array().notNull(),

  status: text('status').default('pending').notNull(),

  /** paymob | bank_transfer | stripe (legacy) */
  payment_method: text('payment_method').default('bank_transfer').notNull(),
  /** unpaid | pending_verification | paid | failed | refunded | partially_refunded */
  payment_status: text('payment_status').default('unpaid').notNull(),
  stripe_checkout_session_id: text('stripe_checkout_session_id'),
  paymob_intention_id: text('paymob_intention_id'),
  paymob_transaction_id: text('paymob_transaction_id'),
  payment_reference: text('payment_reference'),
  paid_at: timestamp('paid_at'),
  refund_status: text('refund_status'),
  refund_amount_omr: decimal('refund_amount_omr', { precision: 10, scale: 2 }),
  invoice_url: text('invoice_url'),
  transfer_receipt_url: text('transfer_receipt_url'),
  verification_notes: text('verification_notes'),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('orders_user_id_idx').on(table.user_id),
  index('orders_status_idx').on(table.status),
  index('orders_payment_status_idx').on(table.payment_status),
  index('orders_created_at_idx').on(table.created_at),
])

export const site_visits = pgTable('site_visits', {
  id: uuid('id').defaultRandom().primaryKey(),
  page: text('page').default('/').notNull(),
  visitor_id: text('visitor_id'),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('site_visits_created_at_idx').on(table.created_at),
])

export const admin_notifications = pgTable('admin_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  order_id: uuid('order_id').references(() => orders.id),
  message: text('message').notNull(),
  is_read: boolean('is_read').default(false),
  created_at: timestamp('created_at').defaultNow(),
})

export const schedule_events = pgTable('schedule_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  type: text('type').default('event').notNull(),
  start_at: timestamp('start_at').notNull(),
  end_at: timestamp('end_at').notNull(),
  created_at: timestamp('created_at').defaultNow(),
})

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: text('phone').notNull(),
  code_hash: text('code_hash').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('otp_codes_phone_idx').on(table.phone),
])

/** Named email lists for AI outreach (companies, partners, etc.) */
export const emailCollections = pgTable('email_collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const emailContacts = pgTable('email_contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  collection_id: uuid('collection_id')
    .notNull()
    .references(() => emailCollections.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  company_name: text('company_name'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('email_contacts_collection_id_idx').on(table.collection_id),
  uniqueIndex('email_contacts_collection_email_uidx').on(table.collection_id, table.email),
])

export type PackageSection = typeof packageSections.$inferSelect
export type Package = typeof packages.$inferSelect
export type PackageCategory = typeof packageCategories.$inferSelect
export type HospitalityService = typeof hospitalityServices.$inferSelect
export type PackageService = typeof packageServices.$inferSelect
export type Order = typeof orders.$inferSelect
export type ScheduleEvent = typeof schedule_events.$inferSelect
export type User = typeof users.$inferSelect
export type EmailCollection = typeof emailCollections.$inferSelect
export type EmailContact = typeof emailContacts.$inferSelect
export type UserRole = 'user' | 'admin'
export type PackageStatus = 'published' | 'draft' | 'archived' | 'hidden'
export type PricingModel = 'fixed' | 'per_guest' | 'starting_from' | 'custom_quote'
export type PackageServiceRole = 'included' | 'optional' | 'addon' | 'recommended'
export type OrderStatus = 'pending' | 'confirmed' | 'active' | 'cancelled' | 'completed'
export type PaymentMethod = 'paymob' | 'bank_transfer' | 'stripe'
export type PaymentStatus =
  | 'unpaid'
  | 'pending_verification'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'not_required'
