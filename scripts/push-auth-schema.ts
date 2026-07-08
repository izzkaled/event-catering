import { config } from 'dotenv'
import { resolve } from 'path'
import { neon } from '@neondatabase/serverless'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      phone text NOT NULL UNIQUE,
      name text,
      email text,
      address text,
      area text,
      role text NOT NULL DEFAULT 'user',
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      phone text NOT NULL,
      code_hash text NOT NULL,
      expires_at timestamp NOT NULL,
      attempts integer NOT NULL DEFAULT 0,
      created_at timestamp DEFAULT now()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS otp_codes_phone_created_idx ON otp_codes (phone, created_at DESC)`

  console.log('Auth tables ready')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
