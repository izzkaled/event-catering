/**
 * Make Neon Auth send OTP with its built-in email (auth@mail.myneon.app).
 * Disables send.otp webhook so Neon does not skip its own mailer.
 *
 * Run: node scripts/use-neon-otp-email.mjs
 * Requires: NEON_API_KEY in .env.local
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

const neonApiKey = process.env.NEON_API_KEY?.trim()
const projectId = process.env.NEON_PROJECT_ID?.trim() || 'holy-haze-60700006'
const branchId = process.env.NEON_BRANCH_ID?.trim() || 'br-restless-union-aj01lw4h'

if (!neonApiKey) {
  console.error('Add NEON_API_KEY to .env.local')
  console.error('https://console.neon.tech/app/settings/api-keys')
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
  console.log('1) Setting Neon shared email provider...')
  const email = await neon('/email_provider', 'PATCH', {
    type: 'shared',
    sender_email: 'auth@mail.myneon.app',
    sender_name: 'Speedy Cleaning',
  })
  if (!email.ok) {
    console.warn('Email provider:', email.status, email.body)
  } else {
    console.log('   ✓ Shared Neon email enabled')
  }

  console.log('2) Disabling send.otp webhook (required so Neon sends mail itself)...')
  const webhook = await neon('/webhooks', 'PUT', { enabled: false })
  if (!webhook.ok) {
    console.error('Webhook disable failed:', webhook.status, webhook.body)
    console.error('Disable manually: Neon Console → Auth → Webhooks → turn OFF send.otp')
    process.exit(1)
  }
  console.log('   ✓ Webhook disabled')
  console.log('\nDone. Neon will send OTP from auth@mail.myneon.app')
  console.log('Check Spam/Junk if the code does not appear in Inbox.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
