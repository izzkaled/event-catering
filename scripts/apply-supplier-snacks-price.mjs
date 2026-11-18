import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)

await sql.query(`
  ALTER TABLE supplier_applications
  ADD COLUMN IF NOT EXISTS snacks_price_omr numeric(10, 2)
`)

console.log('OK: snacks_price_omr added')
