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
} from 'drizzle-orm/pg-core'

export const packages = pgTable('packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name_ar: text('name_ar').notNull(),
  name_en: text('name_en').notNull(),
  hours_per_visit: integer('hours_per_visit').notNull(),
  visits_per_week: integer('visits_per_week').notNull(),
  visits_per_month: integer('visits_per_month').notNull(),
  price_omr: decimal('price_omr', { precision: 10, scale: 2 }).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  is_featured: boolean('is_featured').default(false),
  sort_order: integer('sort_order').default(0),
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

  payment_method: text('payment_method').default('bank_transfer').notNull(),
  payment_status: text('payment_status').default('unpaid').notNull(),
  stripe_checkout_session_id: text('stripe_checkout_session_id'),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('orders_user_id_idx').on(table.user_id),
  index('orders_status_idx').on(table.status),
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

export type Package = typeof packages.$inferSelect
export type Order = typeof orders.$inferSelect
export type ScheduleEvent = typeof schedule_events.$inferSelect
export type User = typeof users.$inferSelect
export type UserRole = 'user' | 'admin'
export type OrderStatus = 'pending' | 'confirmed' | 'active' | 'cancelled' | 'completed'
