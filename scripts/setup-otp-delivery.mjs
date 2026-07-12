/**
 * Fix signup OTP delivery via Neon Auth + Resend.
 *
 * Run: npm run setup:otp
 *
 * Requires in .env.local:
 *   NEON_API_KEY   https://console.neon.tech/app/settings/api-keys
 *   RESEND_API_KEY
 *
 * What it does:
 * 1. Configures Neon Auth to send email through Resend SMTP
 * 2. Disables send.otp webhook (broken webhook blocks SMTP delivery)
 *
 * For branded OTP emails via your app webhook later, re-enable in Neon Console
 * after confirming https://YOUR-SITE/api/webhooks/neon-auth works on Netlify.
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

const neonApiKey = process.env.NEON_API_KEY?.trim()
const resendApiKey = process.env.RESEND_API_KEY?.trim()
const projectId = process.env.NEON_PROJECT_ID?.trim() || 'holy-haze-60700006'
const branchId = process.env.NEON_BRANCH_ID?.trim() || 'br-restless-union-aj01lw4h'

if (!neonApiKey) {
  console.error('Add NEON_API_KEY to .env.local')
  console.error('Create one: https://console.neon.tech/app/settings/api-keys')
  process.exit(1)
}
if (!resendApiKey) {
  console.error('Add RESEND_API_KEY to .env.local')
  process.exit(1)
}

const fromRaw =
  process.env.RESEND_FROM_EMAIL?.trim() || 'Speedy Cleaning <onboarding@resend.dev>'
const senderEmail = fromRaw.match(/<([^>]+)>/)?.[1] || fromRaw
const senderName = fromRaw.match(/^([^<]+)</)?.[1]?.trim() || 'Speedy Cleaning'

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
  if (senderEmail === 'onboarding@resend.dev') {
    console.warn('⚠ RESEND_FROM_EMAIL not set — only your Resend account email can receive OTP.')
    console.warn('  Verify a domain at resend.com/domains, then set RESEND_FROM_EMAIL.\n')
  }

  console.log('1) Configuring Resend SMTP on Neon Auth...')
  const email = await neon('/email_provider', 'PATCH', {
    type: 'standard',
    host: 'smtp.resend.com',
    port: 465,
    username: 'resend',
    password: resendApiKey,
    sender_email: senderEmail,
    sender_name: senderName,
  })
  if (!email.ok) {
    console.error('Failed:', email.status, email.body)
    process.exit(1)
  }
  console.log('   ✓ Resend SMTP ready')

  console.log('2) Disabling send.otp webhook (use SMTP until webhook is verified)...')
  const webhook = await neon('/webhooks', 'PUT', { enabled: false })
  if (!webhook.ok) {
    console.warn('   Webhook update failed (may already be off):', webhook.status, webhook.body)
  } else {
    console.log('   ✓ Webhook disabled — Neon will send OTP via Resend SMTP')
  }

  console.log('\nDone. Test signup at /auth/signup')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
