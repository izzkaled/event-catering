import { config } from 'dotenv'
import { resolve } from 'path'
import { Resend } from 'resend'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim()
  if (!email) throw new Error('ADMIN_EMAIL missing')

  console.log('--- Resend recent emails ---')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const list = await resend.emails.list({ limit: 5 })
  for (const item of list.data?.data ?? []) {
    console.log({
      to: item.to,
      subject: item.subject,
      status: item.last_event,
      created: item.created_at,
    })
  }

  console.log('\n--- Neon OTP via production ---')
  const prod = await fetch('https://clean-plus1.netlify.app/api/auth/email-otp/send-verification-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, type: 'email-verification' }),
  })
  console.log('Production OTP status:', prod.status, await prod.text())

  await new Promise((r) => setTimeout(r, 3000))

  console.log('\n--- Resend after production OTP ---')
  const list2 = await resend.emails.list({ limit: 5 })
  for (const item of list2.data?.data ?? []) {
    console.log({
      to: item.to,
      subject: item.subject,
      status: item.last_event,
      created: item.created_at,
    })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
