import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { generateWithGemini } from '@/lib/gemini'
import { sendOutreachEmail } from '@/lib/email/send-outreach-email'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit'

export const dynamic = 'force-dynamic'

type Body = {
  action?: 'generate' | 'send'
  to?: string[] | string
  subject?: string
  body?: string
  companyName?: string
  /** Extra notes for AI when generating */
  brief?: string
  language?: 'ar' | 'en'
}

function parseRecipients(to: string[] | string | undefined): string[] {
  if (!to) return []
  if (Array.isArray(to)) return to
  return to
    .split(/[,;\n]+/)
    .map((e) => e.trim())
    .filter(Boolean)
}

export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  const ip = getClientIp(request)
  if (!(await checkRateLimit(`outreach:${ip}`))) {
    return NextResponse.json({ error: 'طلبات كثيرة — حاول بعد قليل' }, { status: 429 })
  }

  try {
    const raw = (await request.json()) as Body
    const action = raw.action === 'generate' ? 'generate' : 'send'
    const recipients = parseRecipients(raw.to)
    const companyName = raw.companyName?.trim() || ''
    const language = raw.language === 'en' ? 'en' : 'ar'

    if (action === 'generate') {
      const brief = raw.brief?.trim() || raw.body?.trim() || ''
      if (!brief && !companyName) {
        return NextResponse.json(
          { error: 'اكتب موجزاً أو اسم الشركة ليصيغ المساعد الرسالة' },
          { status: 400 },
        )
      }

      const prompt = `You are the business outreach writer for Speedy Cleaning (Clean Plus), a professional home cleaning subscription service in Muscat, Oman.

Write a B2B outreach email to a company${companyName ? ` named "${companyName}"` : ''}.
Language: ${language === 'ar' ? 'Arabic (Gulf-friendly, professional)' : 'Professional English'}.
Goal: introduce Speedy Cleaning corporate / office / staff-housing cleaning packages, invite a reply, and include a clear call to action (WhatsApp or booking).
Keep it short (120–180 words), respectful, not spammy. No fake discounts.
Extra brief from admin:
${brief || 'Standard corporate cleaning partnership pitch.'}

Return EXACTLY this format (no markdown fences):
SUBJECT: <one line subject>
BODY:
<email body only>`

      const text = await generateWithGemini(prompt)
      const subjectMatch = text.match(/SUBJECT:\s*(.+)/i)
      const bodyMatch = text.match(/BODY:\s*([\s\S]*)/i)
      const subject = (subjectMatch?.[1] || raw.subject || '').trim()
      const body = (bodyMatch?.[1] || text).trim()

      return NextResponse.json({ subject, body, draft: text })
    }

    const result = await sendOutreachEmail({
      to: recipients,
      subject: String(raw.subject || ''),
      body: String(raw.body || ''),
      companyName: companyName || undefined,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('POST /api/admin/outreach-email:', error)
    const message = error instanceof Error ? error.message : 'فشل العملية'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
