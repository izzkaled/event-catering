import { config } from 'dotenv'
import { resolve } from 'path'
import { Resend } from 'resend'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

async function main() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const to = process.env.ADMIN_EMAIL?.trim()
  if (!apiKey || !to) throw new Error('Missing RESEND_API_KEY or ADMIN_EMAIL')

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: 'Speedy Cleaning <onboarding@resend.dev>',
    to,
    subject: 'Resend key test — Speedy Cleaning',
    text: 'If you received this, your new Resend API key works.',
  })

  if (error) {
    console.error('Send failed:', error.message)
    process.exit(1)
  }

  console.log('✓ Test email sent, id:', data?.id)
  console.log('Check inbox:', to)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
