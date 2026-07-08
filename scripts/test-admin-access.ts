import { config } from 'dotenv'
import { resolve } from 'path'
import { isAdminUser } from '../lib/auth/admin'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

const cases: Array<{ label: string; user: Parameters<typeof isAdminUser>[0] }> = [
  { label: 'Google admin email (izzkaled@gmail.com)', user: { email: 'izzkaled@gmail.com' } },
  { label: 'Google email mixed case', user: { email: 'IzzKaled@gmail.com' } },
  { label: 'Wrong Google email', user: { email: 'other@gmail.com' } },
  { label: 'Admin phone +96877222432', user: { phoneNumber: '+96877222432' } },
  { label: 'Admin phone 77222432', user: { phoneNumber: '77222432' } },
  { label: 'Wrong phone', user: { phoneNumber: '+96890000000' } },
  { label: 'No session', user: null },
]

for (const c of cases) {
  const ok = isAdminUser(c.user)
  console.log(`${ok ? 'ALLOW' : 'DENY '} | ${c.label}`)
}
