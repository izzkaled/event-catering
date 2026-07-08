import { neon } from '@neondatabase/serverless'

/** Lightweight DB lookup for Edge middleware (no dotenv import). */
export async function getUserRoleById(userId: string): Promise<'admin' | 'user' | null> {
  const url = process.env.DATABASE_URL
  if (!url) return null

  const sql = neon(url)
  const rows = await sql`SELECT role FROM users WHERE id = ${userId} LIMIT 1`
  const role = rows[0]?.role as string | undefined
  if (role === 'admin' || role === 'user') return role
  return null
}
