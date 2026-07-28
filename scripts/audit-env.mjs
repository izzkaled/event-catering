import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseEnv(file) {
  const p = path.join(root, file)
  if (!fs.existsSync(p)) return null
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)
  const vars = {}
  const keyOrder = []
  const duplicates = []
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (key in vars) duplicates.push(key)
    else keyOrder.push(key)
    vars[key] = val
  }
  return { vars, duplicates, lineCount: lines.length }
}

const placeholders =
  /change-me|xxxxxxxx|your[-_]|example\.com|re_xxxxxxxx|neon_api_key|your-gemini|omn_sk_test_xxxxxxxx|omn_pk_test_xxxxxxxx|your_test_integration|your_hmac|ACxxxxxxxx|VAxxxxxxxx|0x4AAAAAAA/i

function status(key, val) {
  if (val === undefined || val === '') return 'MISSING'
  if (placeholders.test(val)) return 'PLACEHOLDER'
  if (key === 'TWILIO_ACCOUNT_SID' && !val.startsWith('AC')) return 'BAD_FORMAT'
  if (key === 'TWILIO_VERIFY_SERVICE_SID' && val && !val.startsWith('VA'))
    return 'BAD_FORMAT'
  if (key === 'DATABASE_URL' && !val.startsWith('postgresql')) return 'BAD_FORMAT'
  return 'OK'
}

const exampleParsed = parseEnv('.env.example')
const example = exampleParsed?.vars ?? {}
const localParsed = parseEnv('.env.local')
if (!localParsed) {
  console.log('NO .env.local found')
  process.exit(0)
}
const local = localParsed.vars
const duplicates = localParsed.duplicates

const required = [
  'DATABASE_URL',
  'NEON_AUTH_BASE_URL',
  'NEON_AUTH_COOKIE_SECRET',
  'AUTH_SECRET',
  'INTERNAL_API_SECRET',
  'ADMIN_PHONE',
  'ADMIN_EMAIL',
  'NEXT_PUBLIC_SITE_URL',
  'GEMINI_API_KEY',
  'RESEND_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_VERIFY_SERVICE_SID',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY',
  'CLOUDFLARE_TURNSTILE_SECRET_KEY',
]

const paymobKeys = [
  'PAYMOB_SECRET_KEY',
  'PAYMOB_PUBLIC_KEY',
  'NEXT_PUBLIC_PAYMOB_PUBLIC_KEY',
  'PAYMOB_INTEGRATION_ID',
  'PAYMOB_HMAC_SECRET',
]

console.log('=== .env.local audit (values not shown) ===')
console.log('Lines in file:', localParsed.lineCount)
console.log('Keys in .env.local:', Object.keys(local).length)
if (duplicates.length) {
  console.log('Duplicate keys:', [...new Set(duplicates)].join(', '))
}

const exampleKeys = Object.keys(example)
const extra = Object.keys(local).filter((k) => !exampleKeys.includes(k))
console.log(
  'Extra keys (not in .env.example):',
  extra.length ? extra.join(', ') : '(none)',
)

for (const k of required) {
  console.log(`${k}: ${status(k, local[k])}`)
}

console.log('\n--- Paymob ---')
for (const k of paymobKeys) console.log(`${k}: ${status(k, local[k])}`)

const optional = [
  'NEON_API_KEY',
  'NEON_AUTH_WEBHOOK_SECRET',
  'NEON_PROJECT_ID',
  'NEON_BRANCH_ID',
  'RESEND_FROM_EMAIL',
  'RESEND_ACCOUNT_EMAIL',
  'STRIPE_SECRET_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'TRUST_CLOUDFLARE_PROXY',
  'ALLOW_MISSING_TURNSTILE',
  'INTERNAL_APP_URL',
  'BANK_ACCOUNT_NUMBER',
  'BANK_IBAN',
  'PAYMOB_BASE_URL',
  'PAYMOB_CURRENCY',
]

console.log('\n--- Optional (only if present) ---')
for (const k of optional) {
  if (local[k] !== undefined) console.log(`${k}: ${status(k, local[k])}`)
}

if (
  local.AUTH_SECRET &&
  local.NEON_AUTH_COOKIE_SECRET &&
  local.AUTH_SECRET === local.NEON_AUTH_COOKIE_SECRET
) {
  console.log(
    '\nWARN: AUTH_SECRET equals NEON_AUTH_COOKIE_SECRET (separate values recommended)',
  )
}
if (
  local.PAYMOB_PUBLIC_KEY &&
  local.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY &&
  local.PAYMOB_PUBLIC_KEY !== local.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY
) {
  console.log('WARN: PAYMOB_PUBLIC_KEY !== NEXT_PUBLIC_PAYMOB_PUBLIC_KEY')
}
if (local.NEXT_PUBLIC_SITE_URL) {
  const host = local.NEXT_PUBLIC_SITE_URL.replace(/^https?:\/\//, '').split('/')[0]
  if (/localhost|clean-plus/i.test(host)) {
    console.log(`NOTE: NEXT_PUBLIC_SITE_URL host: ${host}`)
  }
}

const sid = local.TWILIO_ACCOUNT_SID?.trim()
if (sid) {
  const hint =
    sid.startsWith('SK') ? 'looks like API Key (SK) — use AC Account SID here' : `prefix ${sid.slice(0, 2)}`
  console.log(`\nTWILIO_ACCOUNT_SID hint: ${hint}`)
}

console.log('\n--- Production checklist (Netlify) ---')
const prodCritical = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY',
  'CLOUDFLARE_TURNSTILE_SECRET_KEY',
]
for (const k of prodCritical) {
  if (status(k, local[k]) !== 'OK') console.log(`  [ ] ${k}`)
}
if (prodCritical.every((k) => status(k, local[k]) === 'OK')) {
  console.log('  All production-hardening vars present locally')
}
