import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)

const statements = [
  'CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id)',
  'CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status)',
  'CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at)',
  'CREATE INDEX IF NOT EXISTS site_visits_created_at_idx ON site_visits (created_at)',
  'CREATE INDEX IF NOT EXISTS otp_codes_phone_idx ON otp_codes (phone)',
]

for (const stmt of statements) {
  await sql.query(stmt)
  console.log('OK:', stmt)
}

const rows = await sql.query(`SELECT indexname FROM pg_indexes WHERE indexname LIKE '%_idx' ORDER BY indexname`)
console.log('Indexes:', rows.map((r) => r.indexname).join(', '))
