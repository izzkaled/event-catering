import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

const BASE = 'http://localhost:3000'
const webhookSecret = process.env.NEON_AUTH_WEBHOOK_SECRET?.trim()
const testEmail = process.env.ADMIN_EMAIL?.trim() || 'test@example.com'
const testPassword = `TestPass${Date.now().toString(36)}!`
const testName = 'OTP Test User'

async function testWebhookOtpDelivery() {
  console.log('\n--- 1) Webhook OTP delivery (Resend) ---')
  if (!webhookSecret) {
    console.log('SKIP: NEON_AUTH_WEBHOOK_SECRET not set')
    return false
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const payload = {
    event_type: 'send.otp',
    event_data: { otp_code: code, otp_type: 'email-verification' },
    user: { email: testEmail, name: testName },
    context: { project_name: 'Speedy Cleaning' },
  }

  const res = await fetch(`${BASE}/api/webhooks/neon-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': webhookSecret,
    },
    body: JSON.stringify(payload),
  })

  const body = await res.json().catch(() => ({}))
  console.log('Status:', res.status)
  console.log('Response:', body)

  if (res.ok) {
    console.log(`OTP code sent via webhook test: ${code}`)
    console.log(`Check inbox: ${testEmail}`)
  }

  return res.ok
}

async function testSignupAndOtpRequest() {
  console.log('\n--- 2) Sign up + request email OTP (Neon Auth) ---')
  console.log('Email:', testEmail)

  const signupRes = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: testName,
    }),
  })

  const signupBody = (await signupRes.json().catch(() => null)) as Record<string, unknown> | null
  console.log('Sign-up status:', signupRes.status)
  console.log('Sign-up response:', JSON.stringify(signupBody, null, 2))

  const otpRes = await fetch(`${BASE}/api/auth/email-otp/send-verification-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      type: 'email-verification',
    }),
  })

  const otpBody = (await otpRes.json().catch(() => null)) as Record<string, unknown> | null
  console.log('OTP request status:', otpRes.status)
  console.log('OTP request response:', JSON.stringify(otpBody, null, 2))

  if (otpRes.ok) {
    console.log('Neon Auth accepted OTP send request — check email if webhook is configured in Neon Console.')
  }

  return otpRes.ok
}

async function main() {
  console.log('Testing email signup + OTP delivery')
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'set' : 'MISSING')
  console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '(default onboarding@resend.dev)')

  const webhookOk = await testWebhookOtpDelivery()
  const signupOk = await testSignupAndOtpRequest()

  console.log('\n--- Summary ---')
  console.log('Webhook Resend delivery:', webhookOk ? 'OK' : 'FAILED')
  console.log('Signup + OTP request:', signupOk ? 'OK' : 'FAILED (may be existing user or auth error)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
