import { config } from 'dotenv'
import { resolve } from 'path'
import { neon } from '@neondatabase/serverless'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

const sql = neon(process.env.DATABASE_URL)

async function main() {
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'bank_transfer'`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid'`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text`

  console.log('Stripe payment columns ready on orders table')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
