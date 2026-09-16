import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`ALTER TABLE hospitality_services ADD COLUMN IF NOT EXISTS pricing_model text DEFAULT 'fixed' NOT NULL`
console.log('MIGRATION_OK')
