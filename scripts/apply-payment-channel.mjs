import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_channel text`
await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_card_last4 text`
await sql`CREATE INDEX IF NOT EXISTS orders_payment_channel_idx ON orders (payment_channel)`
console.log('MIGRATION_OK')
