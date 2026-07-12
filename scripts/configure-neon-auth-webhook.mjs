/**
 * Enable Neon Auth send.otp webhook → your app sends OTP via Resend.
 *
 * Run: node scripts/configure-neon-auth-webhook.mjs
 *
 * Requires in .env.local:
 *   NEON_API_KEY          (console.neon.tech → Account → API keys)
 *   NEXT_PUBLIC_SITE_URL  (e.g. https://clean-plus1.netlify.app)
 *
 * Optional:
 *   NEON_PROJECT_ID       (default: cleanplus-auth project)
 *   NEON_BRANCH_ID        (default: main branch)
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

const apiKey = process.env.NEON_API_KEY?.trim()
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '')
const projectId = process.env.NEON_PROJECT_ID?.trim() || 'snowy-hill-56005899'
const branchId = process.env.NEON_BRANCH_ID?.trim() || 'br-curly-grass-aj8ao7z3'

if (!apiKey) {
  console.error('Missing NEON_API_KEY in .env.local')
  console.error('Create one at https://console.neon.tech/app/settings/api-keys')
  process.exit(1)
}

if (!siteUrl.startsWith('https://')) {
  console.error('NEXT_PUBLIC_SITE_URL must be an HTTPS URL (Neon rejects localhost for webhooks)')
  process.exit(1)
}

const webhookUrl = `${siteUrl}/api/webhooks/neon-auth`

async function api(path, init = {}) {
  const res = await fetch(`https://console.neon.tech/api/v2${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { res, body }
}

async function main() {
  console.log('Current webhook config...')
  const current = await api(`/projects/${projectId}/branches/${branchId}/auth/webhooks`)
  console.log(current.res.status, JSON.stringify(current.body, null, 2))

  console.log('\nUpdating webhook →', webhookUrl)
  const updated = await api(`/projects/${projectId}/branches/${branchId}/auth/webhooks`, {
    method: 'PUT',
    body: JSON.stringify({
      enabled: true,
      webhook_url: webhookUrl,
      enabled_events: ['send.otp'],
      timeout_seconds: 10,
    }),
  })

  if (!updated.res.ok) {
    console.error('Failed:', updated.res.status, updated.body)
    process.exit(1)
  }

  console.log('✓ Webhook configured')
  console.log(JSON.stringify(updated.body, null, 2))
  console.log('\nEnsure Netlify env has RESEND_API_KEY set.')
  console.log('For any user email (not just yours), verify a domain in Resend and set RESEND_FROM_EMAIL.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
