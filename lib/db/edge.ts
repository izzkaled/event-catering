import { neon } from '@neondatabase/serverless'
import { preferNeonPoolerHostname } from '@/lib/db/connection-url'

/** Lightweight DB lookup for Edge middleware (no dotenv import). */
export async function getUserRoleById(userId: string): Promise<'admin' | 'user' | null> {
  const raw = process.env.DATABASE_POOLER_URL?.trim() || process.env.DATABASE_URL?.trim()
  if (!raw) return null

  const url = preferNeonPoolerHostname(raw)
  const sql = neon(url)
  const rows = await sql`SELECT role FROM users WHERE id = ${userId} LIMIT 1`
  const role = rows[0]?.role as string | undefined
  if (role === 'admin' || role === 'user') return role
  return null
}
