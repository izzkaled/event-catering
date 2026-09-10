/**
 * Neon Auth OTP via built-in shared email only (auth@mail.myneon.app).
 * Disables send.otp webhook so Neon does not skip its own mailer.
 *
 * Run: npm run setup:neon-otp
 * Requires: NEON_API_KEY, and optionally NEON_PROJECT_ID + NEON_BRANCH_ID
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

const neonApiKey = process.env.NEON_API_KEY?.trim()
const projectId = process.env.NEON_PROJECT_ID?.trim()
const branchId = process.env.NEON_BRANCH_ID?.trim()

if (!neonApiKey) {
  console.error('Add NEON_API_KEY to .env.local')
  console.error('https://console.neon.tech/app/settings/api-keys')
  process.exit(1)
}

if (!projectId || !branchId) {
  console.error('Add NEON_PROJECT_ID and NEON_BRANCH_ID to .env.local')
  console.error('Neon Console → Project Settings → copy Project ID + Branch ID')
  process.exit(1)
}

const base = `https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/auth`

async function neon(path, method, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${neonApiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = text
  }
  return { ok: res.ok, status: res.status, body: parsed }
}

async function main() {
  console.log('1) Neon shared email provider (built-in OTP)...')
  const email = await neon('/email_provider', 'PATCH', {
    type: 'shared',
    sender_email: 'auth@mail.myneon.app',
    sender_name: 'Event Catering',
  })
  if (!email.ok) {
    console.warn('   Email provider:', email.status, email.body)
    console.warn('   Continue — disable webhook anyway.')
  } else {
    console.log('   ✓ Shared Neon email → Event Catering <auth@mail.myneon.app>')
  }

  console.log('2) Disabling Auth webhooks (so Neon sends OTP itself)...')
  const webhook = await neon('/webhooks', 'PUT', { enabled: false })
  if (!webhook.ok) {
    console.error('   Webhook disable failed:', webhook.status, webhook.body)
    console.error('   Manual: Neon Console → Auth → Webhooks → OFF / uncheck send.otp')
    process.exit(1)
  }
  console.log('   ✓ Webhooks disabled')
  console.log('\nDone. OTP comes from Neon only (auth@mail.myneon.app). Check Spam if needed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
