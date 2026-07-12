/**
 * Smoke-test admin allowlist helpers.
 * Reads ADMIN_EMAIL / ADMIN_PHONE from .env.local — does not hardcode real identities.
 *
 * Run: npx tsx scripts/test-admin-access.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { isAdminUser } from '../lib/auth/admin'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

const adminEmail = process.env.ADMIN_EMAIL?.trim()
const adminPhone = process.env.ADMIN_PHONE?.trim()

const cases: Array<{ label: string; user: Parameters<typeof isAdminUser>[0] }> = [
  { label: 'Configured admin email', user: { email: adminEmail || 'missing@example.com' } },
  { label: 'Admin email mixed case', user: { email: adminEmail?.toUpperCase() || 'MISSING@EXAMPLE.COM' } },
  { label: 'Wrong email', user: { email: 'other@example.com' } },
  { label: 'Configured admin phone', user: { phoneNumber: adminPhone || '+96800000000' } },
  { label: 'Wrong phone', user: { phoneNumber: '+96890000000' } },
  { label: 'Sticky role alone (must DENY)', user: { role: 'admin', email: 'attacker@example.com' } },
  { label: 'No session', user: null },
]

for (const c of cases) {
  const ok = isAdminUser(c.user)
  console.log(`${ok ? 'ALLOW' : 'DENY '} | ${c.label}`)
}
