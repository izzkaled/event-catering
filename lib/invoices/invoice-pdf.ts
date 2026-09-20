import { jsPDF } from 'jspdf'
import type { Order } from '@/lib/db/schema'
import fs from 'node:fs'
import path from 'node:path'
import { getLogoBase64 } from '@/lib/invoices/logo'
import { resolvePublicSiteUrl } from '@/lib/seo'

type InvoiceKind = 'requested' | 'confirmed'
type InvoiceAudience = 'customer' | 'admin'

const BRAND = { r: 74, g: 35, b: 74 }
const MUTED = { r: 110, g: 95, b: 100 }
const LINE = { r: 230, g: 220, b: 225 }

function safe(v: unknown) {
  return String(v ?? '').trim()
}

function formatOmr(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return safe(v) || '—'
  return `${n.toFixed(2)} OMR`
}

function payLabel(status: string, paid: boolean) {
  if (paid) return { en: 'Paid', ar: 'مدفوع' }
  const map: Record<string, { en: string; ar: string }> = {
    unpaid: { en: 'Unpaid', ar: 'غير مدفوع' },
    pending_verification: { en: 'Pending verification', ar: 'بانتظار التحقق' },
    failed: { en: 'Failed', ar: 'فشل الدفع' },
    refunded: { en: 'Refunded', ar: 'مسترد' },
    partially_refunded: { en: 'Partially refunded', ar: 'مسترد جزئياً' },
  }
  return map[status] || { en: safe(status), ar: safe(status) }
}

function orderStatusLabel(status: string, kind: InvoiceKind) {
  const map: Record<string, { en: string; ar: string }> = {
    pending: { en: 'Pending review', ar: 'بانتظار المراجعة' },
    confirmed: { en: 'Confirmed', ar: 'مؤكد' },
    active: { en: 'In progress', ar: 'قيد التنفيذ' },
    cancelled: { en: 'Cancelled', ar: 'ملغي' },
    completed: { en: 'Completed', ar: 'مكتمل' },
  }
  return (
    map[status] || {
      en: kind === 'confirmed' ? 'Confirmed' : 'Pending review',
      ar: kind === 'confirmed' ? 'مؤكد' : 'بانتظار المراجعة',
    }
  )
}

let amiriBase64: string | null = null
function ensureArabicFont(doc: jsPDF) {
  if (!amiriBase64) {
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Amiri-Regular.ttf')
    const bytes = fs.readFileSync(fontPath)
    amiriBase64 = bytes.toString('base64')
  }
  doc.addFileToVFS('Amiri-Regular.ttf', amiriBase64)
  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
}

function supportWhatsAppDisplay() {
  const raw = safe(process.env.NEXT_PUBLIC_WHATSAPP || '96877222432').replace(/\D/g, '')
  return raw.startsWith('968') ? `+968 ${raw.slice(3)}` : `+${raw}`
}

function siteUrl() {
  return resolvePublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
}

function drawHeader(doc: jsPDF, left: number, right: number) {
  const logo = getLogoBase64()
  if (logo) {
    try {
      doc.addImage(`data:image/webp;base64,${logo}`, 'WEBP', left, 28, 40, 40)
    } catch {
      try {
        doc.addImage(`data:image/png;base64,${logo}`, 'PNG', left, 28, 40, 40)
      } catch {
        /* logo optional */
      }
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
    doc.text('Event Catering', left + 52, 46)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text('Muscat, Oman', left + 52, 60)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
    doc.text('Event Catering', left, 48)
  }

  doc.setDrawColor(LINE.r, LINE.g, LINE.b)
  doc.setLineWidth(0.8)
  doc.line(left, 82, right, 82)
  doc.setTextColor(0, 0, 0)
}

function drawBadge(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  fill: { r: number; g: number; b: number },
) {
  const w = Math.max(72, doc.getTextWidth(text) + 20)
  const h = 20
  doc.setFillColor(fill.r, fill.g, fill.b)
  doc.roundedRect(x - w, y, w, h, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(text.toUpperCase(), x - w / 2, y + 13.5, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

/** Simple bilingual kv row without heavy table grid. */
function drawKv(
  doc: jsPDF,
  left: number,
  right: number,
  y: number,
  labelAr: string,
  labelEn: string,
  value: string,
) {
  ensureArabicFont(doc)
  doc.setFont('Amiri', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(labelAr, right, y, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(labelEn, left, y)

  doc.setTextColor(30, 20, 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const lines = doc.splitTextToSize(value || '—', right - left - 8)
  doc.text(lines, left, y + 14)
  return y + 14 + Math.max(1, lines.length) * 13 + 10
}

function drawSectionTitle(doc: jsPDF, left: number, right: number, y: number, ar: string, en: string) {
  ensureArabicFont(doc)
  doc.setFont('Amiri', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
  doc.text(ar, right, y, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(en, left, y)
  doc.setDrawColor(LINE.r, LINE.g, LINE.b)
  doc.line(left, y + 6, right, y + 6)
  doc.setTextColor(0, 0, 0)
  return y + 22
}

function ensureSpace(doc: jsPDF, y: number, need: number, pageH: number) {
  if (y + need < pageH - 56) return y
  doc.addPage()
  return 48
}

function buildCustomerPdf(order: Order, kind: InvoiceKind): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const left = 48
  const right = pageW - 48
  const paid = order.payment_status === 'paid'
  const pay = payLabel(order.payment_status, paid)

  drawHeader(doc, left, right)

  const badgeFill = paid
    ? BRAND
    : order.payment_status === 'pending_verification'
      ? { r: 180, g: 140, b: 70 }
      : { r: 150, g: 140, b: 145 }
  drawBadge(doc, right, 34, pay.en, badgeFill)

  ensureArabicFont(doc)
  doc.setFont('Amiri', 'normal')
  doc.setFontSize(18)
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
  doc.text(paid ? 'فاتورة مدفوعة' : 'ملخص الطلب', right, 108, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(paid ? 'Paid invoice' : 'Order summary', left, 108)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 20, 30)
  doc.text(safe(order.order_number), left, 128)

  ensureArabicFont(doc)
  doc.setFont('Amiri', 'normal')
  doc.setFontSize(11)
  doc.text(safe(order.customer_name) || '—', right, 128, { align: 'right' })

  let y = 158
  y = drawSectionTitle(doc, left, right, y, 'تفاصيل المناسبة', 'Event details')

  const packageLabel =
    [safe(order.package_name_ar), safe(order.package_name_en)].filter(Boolean).join(' · ') || '—'
  const days = (order.preferred_days || []).filter(Boolean).join(' · ') || '—'

  y = drawKv(doc, left, right, y, 'الباقة', 'Package', packageLabel)
  y = drawKv(doc, left, right, y, 'عدد الضيوف', 'Guests', String(order.visits_per_week || '—'))
  y = drawKv(doc, left, right, y, 'ساعات الخدمة', 'Service hours', String(order.hours_per_visit || '—'))
  y = drawKv(doc, left, right, y, 'تاريخ المناسبة', 'Event date', safe(order.start_date) || '—')
  y = drawKv(doc, left, right, y, 'الوقت المفضل', 'Preferred time', safe(order.preferred_time) || '—')
  if (days !== '—') y = drawKv(doc, left, right, y, 'اليوم', 'Day', days)
  y = drawKv(
    doc,
    left,
    right,
    y,
    'الموقع',
    'Location',
    [safe(order.customer_area), safe(order.customer_address)].filter(Boolean).join(' — ') || '—',
  )

  y = ensureSpace(doc, y, 90, pageH)
  y = drawSectionTitle(doc, left, right, y, 'المبلغ', 'Amount')

  doc.setFillColor(248, 244, 240)
  doc.roundedRect(left, y, right - left, 56, 6, 6, 'F')
  ensureArabicFont(doc)
  doc.setFont('Amiri', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(paid ? 'المبلغ المدفوع' : 'التقدير الإجمالي', right - 14, y + 22, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
  doc.text(formatOmr(order.price_omr), left + 14, y + 36)
  y += 76

  const brief = safe(order.notes)
  if (brief) {
    y = ensureSpace(doc, y, 80, pageH)
    y = drawSectionTitle(doc, left, right, y, 'ملاحظاتك', 'Your notes')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 30, 40)
    const noteLines = doc.splitTextToSize(brief.slice(0, 600), right - left)
    doc.text(noteLines, left, y)
    y += noteLines.length * 12 + 16
  }

  doc.setDrawColor(LINE.r, LINE.g, LINE.b)
  doc.line(left, pageH - 52, right, pageH - 52)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(`WhatsApp: ${supportWhatsAppDisplay()}`, left, pageH - 34)
  doc.text(`${siteUrl()}/profile`, left, pageH - 22)
  ensureArabicFont(doc)
  doc.setFont('Amiri', 'normal')
  doc.setFontSize(9)
  doc.text(
    paid ? 'شكراً لثقتك بإيفنت كاترينج' : 'سيتواصل معك فريقنا خلال 24 ساعة',
    right,
    pageH - 28,
    { align: 'right' },
  )

  return Buffer.from(doc.output('arraybuffer') as ArrayBuffer)
}

function buildAdminPdf(order: Order, kind: InvoiceKind): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const left = 44
  const right = pageW - 44
  const paid = order.payment_status === 'paid'
  const pay = payLabel(order.payment_status, paid)
  const status = orderStatusLabel(order.status, kind)
  const phoneDigits = safe(order.customer_phone).replace(/\D/g, '')

  drawHeader(doc, left, right)
  drawBadge(doc, right, 34, 'ADMIN', BRAND)

  ensureArabicFont(doc)
  doc.setFont('Amiri', 'normal')
  doc.setFontSize(17)
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
  doc.text('تفاصيل طلب العميل', right, 108, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text('Customer order details', left, 108)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(30, 20, 30)
  doc.text(safe(order.order_number), left, 128)

  let y = 152
  y = drawSectionTitle(doc, left, right, y, 'بيانات العميل', 'Customer')
  y = drawKv(doc, left, right, y, 'الاسم', 'Name', safe(order.customer_name))
  y = drawKv(doc, left, right, y, 'الجوال', 'Phone', safe(order.customer_phone))
  y = drawKv(doc, left, right, y, 'البريد', 'Email', safe(order.customer_email) || '—')
  y = drawKv(doc, left, right, y, 'المنطقة', 'Area', safe(order.customer_area))
  y = drawKv(doc, left, right, y, 'العنوان / المكان', 'Address / venue', safe(order.customer_address))

  y = ensureSpace(doc, y, 120, pageH)
  y = drawSectionTitle(doc, left, right, y, 'ماذا يريد العميل', 'What the customer wants')
  const packageLabel =
    [safe(order.package_name_ar), safe(order.package_name_en)].filter(Boolean).join(' / ') || '—'
  y = drawKv(doc, left, right, y, 'الباقة', 'Package', packageLabel)
  y = drawKv(doc, left, right, y, 'عدد الضيوف', 'Guests', String(order.visits_per_week))
  y = drawKv(doc, left, right, y, 'ساعات الخدمة', 'Hours', String(order.hours_per_visit))
  y = drawKv(doc, left, right, y, 'تاريخ المناسبة', 'Event date', safe(order.start_date))
  y = drawKv(doc, left, right, y, 'الوقت', 'Time', safe(order.preferred_time))
  y = drawKv(
    doc,
    left,
    right,
    y,
    'الأيام',
    'Days',
    (order.preferred_days || []).filter(Boolean).join(', ') || '—',
  )

  y = ensureSpace(doc, y, 100, pageH)
  y = drawSectionTitle(doc, left, right, y, 'الحالة والمبلغ', 'Status & amount')
  y = drawKv(doc, left, right, y, 'حالة الطلب', 'Order status', `${status.ar} / ${status.en}`)
  y = drawKv(doc, left, right, y, 'حالة الدفع', 'Payment', `${pay.ar} / ${pay.en}`)
  y = drawKv(
    doc,
    left,
    right,
    y,
    'طريقة الدفع',
    'Payment method',
    [safe(order.payment_method), safe(order.payment_channel)].filter(Boolean).join(' · ') || '—',
  )
  if (order.payment_card_last4) {
    y = drawKv(doc, left, right, y, 'آخر 4 أرقام', 'Card last4', `**** ${order.payment_card_last4}`)
  }
  y = drawKv(doc, left, right, y, 'التقدير', 'Estimated total', formatOmr(order.price_omr))
  y = drawKv(doc, left, right, y, 'عمولة المنصة', 'Commission', formatOmr(order.commission_omr))
  y = drawKv(doc, left, right, y, 'صافي الإيراد', 'Net revenue', formatOmr(order.net_revenue_omr))
  if (order.payment_reference) {
    y = drawKv(doc, left, right, y, 'مرجع الدفع', 'Payment ref', safe(order.payment_reference))
  }

  const notes = safe(order.notes)
  if (notes) {
    y = ensureSpace(doc, y, 90, pageH)
    y = drawSectionTitle(doc, left, right, y, 'ملخص الطلب الكامل', 'Full request brief')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(35, 25, 35)
    const lines = doc.splitTextToSize(notes, right - left)
    for (const line of lines) {
      y = ensureSpace(doc, y, 16, pageH)
      doc.text(line, left, y)
      y += 12
    }
    y += 10
  }

  if (order.verification_notes) {
    y = ensureSpace(doc, y, 60, pageH)
    y = drawSectionTitle(doc, left, right, y, 'ملاحظات التحقق', 'Verification notes')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    const lines = doc.splitTextToSize(safe(order.verification_notes), right - left)
    doc.text(lines, left, y)
    y += lines.length * 12 + 8
  }

  doc.setDrawColor(LINE.r, LINE.g, LINE.b)
  doc.line(left, pageH - 58, right, pageH - 58)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text(`Admin: ${siteUrl()}/admin/orders`, left, pageH - 40)
  if (phoneDigits) {
    doc.text(`Customer WhatsApp: https://wa.me/${phoneDigits}`, left, pageH - 28)
  }
  doc.text(`Generated: ${new Date().toISOString()}`, left, pageH - 16)

  return Buffer.from(doc.output('arraybuffer') as ArrayBuffer)
}

export function buildInvoicePdfBuffer(
  order: Order,
  kind: InvoiceKind,
  audience: InvoiceAudience = 'customer',
): Buffer {
  return audience === 'admin' ? buildAdminPdf(order, kind) : buildCustomerPdf(order, kind)
}
