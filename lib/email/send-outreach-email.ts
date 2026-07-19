import { Resend } from 'resend'
import { emailLogoHtml } from '@/lib/email/brand-header'
import { escapeHtml } from '@/lib/security/escape-html'
import { getResendFromAddress, isResendSandboxFrom, resendSandboxOwnerHint } from '@/lib/email/send-otp-email'

const APP_NAME = 'Speedy Cleaning'

export type OutreachEmailInput = {
  to: string[]
  subject: string
  body: string
  companyName?: string
}

function plainToHtml(text: string): string {
  const escaped = escapeHtml(text)
  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 14px;line-height:1.65">${para.replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

export async function sendOutreachEmail(input: OutreachEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('RESEND_API_KEY غير مُعدّ — أضفه في .env.local')
  }

  const recipients = [
    ...new Set(
      input.to
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
    ),
  ]

  if (!recipients.length) {
    throw new Error('أضف إيميلاً واحداً على الأقل بصيغة صحيحة')
  }

  const subject = input.subject.trim()
  const body = input.body.trim()
  if (!subject || !body) {
    throw new Error('الموضوع ونص الرسالة مطلوبان')
  }

  if (isResendSandboxFrom()) {
    const owner = (process.env.RESEND_ACCOUNT_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const blocked = recipients.filter((r) => r !== owner)
    if (blocked.length) {
      throw new Error(
        resendSandboxOwnerHint() ||
          'وضع تجريبي لـ Resend: لا يمكن الإرسال إلا لحسابك أو بعد توثيق النطاق',
      )
    }
  }

  const resend = new Resend(apiKey)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'
  const companyLine = input.companyName?.trim()
    ? `<p style="color:#64748b;font-size:13px">إلى: ${escapeHtml(input.companyName.trim())}</p>`
    : ''

  const { data, error } = await resend.emails.send({
    from: getResendFromAddress(),
    to: recipients,
    subject,
    html: `
      <div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;max-width:560px;margin:0 auto;color:#0f172a">
        ${emailLogoHtml(siteUrl)}
        ${companyLine}
        <h2 style="font-size:18px;margin:0 0 16px">${escapeHtml(subject)}</h2>
        ${plainToHtml(body)}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="font-size:13px;color:#64748b;margin:0">
          ${APP_NAME} · خدمات تنظيف احترافية في مسقط<br/>
          واتساب: <a href="https://wa.me/${whatsapp}">+${whatsapp}</a><br/>
          <a href="${siteUrl}">${siteUrl}</a>
        </p>
      </div>
    `,
    text: `${subject}\n\n${body}\n\n— ${APP_NAME}\nWhatsApp: +${whatsapp}\n${siteUrl}`,
  })

  if (error) {
    throw new Error(error.message || 'فشل إرسال البريد عبر Resend')
  }

  return { id: data?.id ?? null, recipients }
}
