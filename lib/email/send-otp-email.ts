import { Resend } from 'resend'
import { emailLogoHtml } from '@/lib/email/brand-header'

const APP_NAME = 'Speedy Cleaning'

export function getResendFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || 'Speedy Cleaning <onboarding@resend.dev>'
}

export function isResendSandboxFrom(from = getResendFromAddress()): boolean {
  return from.includes('onboarding@resend.dev')
}

/** Resend sandbox only delivers to the account owner email unless a domain is verified. */
export function resendSandboxOwnerHint(): string | null {
  if (!isResendSandboxFrom()) return null
  const owner = process.env.RESEND_ACCOUNT_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim()
  if (!owner) return 'Verify a domain at resend.com/domains and set RESEND_FROM_EMAIL for all user emails.'
  return `Resend sandbox only delivers to ${owner}. Verify a domain and set RESEND_FROM_EMAIL to email any user.`
}

export async function sendOtpEmail(to: string, code: string, appName = APP_NAME) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required to deliver email OTP')
  }

  const hint = resendSandboxOwnerHint()
  if (hint && to.trim().toLowerCase() !== (process.env.RESEND_ACCOUNT_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase()) {
    throw new Error(hint)
  }

  const resend = new Resend(apiKey)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

  const { error } = await resend.emails.send({
    from: getResendFromAddress(),
    to,
    subject: `${appName}: verification code ${code}`,
    html: `
      <div style="font-family:sans-serif;line-height:1.5;max-width:480px;margin:0 auto">
        ${emailLogoHtml(siteUrl)}
        <h2>${appName}</h2>
        <p>Your verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:0.2em">${code}</p>
        <p>This code expires in 15 minutes.</p>
      </div>
    `,
    text: `${appName} verification code: ${code}\nThis code expires in 15 minutes.`,
  })

  if (error) {
    throw new Error(error.message || 'Failed to send email via Resend')
  }
}
