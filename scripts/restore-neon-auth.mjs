/**
 * Re-enable Neon Auth after it was removed in the Console.
 * Keeps existing users in neon_auth schema when possible.
 *
 * Run: node scripts/restore-neon-auth.mjs
 *
 * Requires NEON_API_KEY in .env.local
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

const base = `https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}`

async function api(path, method, body) {
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
  console.log('Checking current auth status...')
  const current = await api('/auth', 'GET')
  console.log('GET /auth:', current.status, JSON.stringify(current.body, null, 2))

  if (current.ok) {
    console.log('\n✓ Neon Auth is already enabled.')
    console.log('base_url:', current.body?.base_url)
    return
  }

  console.log('\nRe-enabling Neon Auth (keeps neon_auth schema + users)...')
  const enable = await api('/auth', 'POST', { auth_provider: 'better_auth' })

  if (enable.ok) {
    console.log('\n✓ Neon Auth re-enabled')
    console.log(JSON.stringify(enable.body, null, 2))
    console.log('\nUpdate .env.local if base_url changed:')
    console.log('  NEON_AUTH_BASE_URL=' + enable.body?.base_url)
    return
  }

  console.error('\nRe-enable failed:', enable.status, enable.body)

  if (
    typeof enable.body === 'object' &&
    enable.body !== null &&
    JSON.stringify(enable.body).toLowerCase().includes('schema')
  ) {
    console.error(`
Neon blocked re-enable because neon_auth schema still exists.

Option A — keep 8 existing users (try Neon Console):
  Project → Auth → Enable Auth (do NOT choose "provision new")

Option B — fresh start (DELETES ALL USERS):
  1. In Neon SQL Editor run: DROP SCHEMA neon_auth CASCADE;
  2. Neon Console → Auth → Enable Auth
  3. Update NEON_AUTH_BASE_URL in .env.local from the new Auth URL
`)
  }

  process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
