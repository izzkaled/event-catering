import { jsPDF } from 'jspdf'
import type { Order } from '@/lib/db/schema'
import fs from 'node:fs'
import path from 'node:path'
import { getLogoBase64 } from '@/lib/invoices/logo'

type InvoiceKind = 'requested' | 'confirmed'
type InvoiceAudience = 'customer' | 'admin'

function safe(v: unknown) {
  return String(v ?? '').trim()
}

function formatOmr(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return safe(v)
  return n.toFixed(2)
}

function drawCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  opts?: { align?: 'left' | 'center' | 'right'; bold?: boolean },
) {
  doc.setDrawColor(226)
  doc.rect(x, y, w, h)
  doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
  doc.setFontSize(10.5)
  const padX = 8
  const padY = 14
  const align = opts?.align ?? 'left'
  const tx =
    align === 'left' ? x + padX : align === 'center' ? x + w / 2 : x + w - padX
  doc.text(text || '-', tx, y + padY, {
    align,
    maxWidth: w - padX * 2,
  })
}

let amiriBase64: string | null = null
function ensureArabicFont(doc: jsPDF) {
  // jsPDF fonts are registered per-document instance.
  // We cache the base64 of the TTF, but we must register it on every new jsPDF().
  if (!amiriBase64) {
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Amiri-Regular.ttf')
    const bytes = fs.readFileSync(fontPath)
    amiriBase64 = bytes.toString('base64')
  }
  doc.addFileToVFS('Amiri-Regular.ttf', amiriBase64)
  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
}

function drawCellBilingual(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  en: string,
  ar: string,
  opts?: { bold?: boolean },
) {
  doc.setDrawColor(226)
  doc.rect(x, y, w, h)

  const padX = 8
  const line1Y = y + 12
  const line2Y = y + 24

  // English line (left)
  doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
  doc.setFontSize(9.5)
  doc.text(en || '-', x + padX, line1Y, { maxWidth: w - padX * 2 })

  // Arabic line (right) using embedded font
  ensureArabicFont(doc)
  doc.setFont('Amiri', 'normal')
  doc.setFontSize(10.5)
  doc.text(ar || '-', x + w - padX, line2Y, { align: 'right', maxWidth: w - padX * 2 })
}

export function buildInvoicePdfBuffer(
  order: Order,
  kind: InvoiceKind,
  audience: InvoiceAudience = 'customer',
): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const paid = order.payment_status === 'paid'
  const statusMap: Record<string, { en: string; ar: string }> = {
    pending: { en: 'Pending review', ar: 'بانتظار المراجعة' },
    confirmed: { en: 'Quote confirmed', ar: 'تم تأكيد العرض' },
    active: { en: 'In progress', ar: 'قيد التنفيذ' },
    cancelled: { en: 'Cancelled', ar: 'ملغي' },
    completed: { en: 'Completed', ar: 'مكتمل' },
  }
  const payMap: Record<string, { en: string; ar: string }> = {
    unpaid: { en: 'Unpaid', ar: 'غير مدفوع' },
    pending_verification: { en: 'Pending verification', ar: 'بانتظار التحقق' },
    paid: { en: 'Paid', ar: 'مدفوع' },
    failed: { en: 'Failed / rejected', ar: 'فشل / مرفوض' },
    refunded: { en: 'Refunded', ar: 'مسترد' },
    partially_refunded: { en: 'Partially refunded', ar: 'مسترد جزئياً' },
  }
  const orderStatus = statusMap[order.status] || {
    en: kind === 'confirmed' ? 'Confirmed' : 'Pending review',
    ar: kind === 'confirmed' ? 'تم التأكيد' : 'بانتظار المراجعة',
  }
  const payStatus = payMap[order.payment_status] || { en: safe(order.payment_status), ar: safe(order.payment_status) }

  const titleEn = paid
    ? 'Hospitality Invoice (Paid)'
    : kind === 'confirmed'
      ? 'Hospitality Quote Invoice'
      : 'Hospitality Request Invoice'
  const titleAr = paid
    ? 'فاتورة ضيافة (مدفوعة)'
    : kind === 'confirmed'
      ? 'فاتورة عرض ضيافة'
      : 'فاتورة طلب ضيافة'

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const left = 40
  const right = pageW - 40

  const brandEn = 'Event Catering'
  const logo = getLogoBase64()
  if (logo) {
    doc.addImage(`data:image/png;base64,${logo}`, 'PNG', left, 18, 52, 52)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(brandEn, left + 62, 42)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Oman · Muscat', left + 62, 58)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(brandEn, left, 50)
  }

  // Payment badge (top-right)
  const badgeW = 88
  const badgeH = 22
  const badgeX = right - badgeW
  const badgeY = 28
  if (paid) {
    doc.setFillColor(74, 35, 74)
  } else if (order.payment_status === 'pending_verification') {
    doc.setFillColor(201, 168, 108)
  } else {
    doc.setFillColor(180, 160, 140)
  }
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(payStatus.en.toUpperCase(), badgeX + badgeW / 2, badgeY + 15, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(titleEn, left, logo ? 82 : 72)
  ensureArabicFont(doc)
  doc.setFont('Amiri', 'normal')
  doc.setFontSize(12)
  doc.text(titleAr, right, logo ? 82 : 72, { align: 'right' })

  doc.setDrawColor(220)
  doc.line(left, logo ? 98 : 90, right, logo ? 98 : 90)

  const col1 = 190
  const col2 = right - left - col1
  const rowH = 28
  let y = logo ? 118 : 110

  drawCellBilingual(doc, left, y, col1, rowH, 'Field', 'الحقل', { bold: true })
  drawCellBilingual(doc, left + col1, y, col2, rowH, 'Value', 'القيمة', { bold: true })
  y += rowH

  const notesPreview = safe(order.notes).slice(0, 180)
  const rows: Array<[string, string, string, string]> = [
    ['Order number', 'رقم الطلب', safe(order.order_number), safe(order.order_number)],
    ['Order status', 'حالة الطلب', orderStatus.en, orderStatus.ar],
    ['Payment status', 'حالة الدفع', payStatus.en, payStatus.ar],
    ['Customer name', 'اسم العميل', safe(order.customer_name), safe(order.customer_name)],
    ['Customer phone', 'رقم الجوال', safe(order.customer_phone), safe(order.customer_phone)],
    ['Customer email', 'البريد الإلكتروني', safe(order.customer_email), safe(order.customer_email)],
    ['Area', 'المنطقة', safe(order.customer_area), safe(order.customer_area)],
    ['Venue / address', 'الموقع / العنوان', safe(order.customer_address), safe(order.customer_address)],
    ['Package', 'الباقة', safe(order.package_name_en || ''), safe(order.package_name_ar || '')],
    ['Guests (est.)', 'الضيوف (تقديري)', safe(order.visits_per_week), safe(order.visits_per_week)],
    ['Service hours', 'ساعات الخدمة', safe(order.hours_per_visit), safe(order.hours_per_visit)],
    ['Event date', 'تاريخ المناسبة', safe(order.start_date), safe(order.start_date)],
    ['Preferred time', 'الوقت المفضل', safe(order.preferred_time), safe(order.preferred_time)],
    [
      'Event day',
      'يوم المناسبة',
      safe((order.preferred_days || []).join(', ')),
      safe((order.preferred_days || []).join('، ')),
    ],
    ['Estimated total (OMR)', 'التقدير الإجمالي (ر.ع)', formatOmr(order.price_omr), formatOmr(order.price_omr)],
  ]

  if (notesPreview) {
    rows.push(['Brief', 'ملخص الطلب', notesPreview, notesPreview])
  }

  for (const [kEn, kAr, vEn, vAr] of rows) {
    if (y + rowH > pageH - 80) {
      doc.addPage()
      y = 60
      drawCellBilingual(doc, left, y, col1, rowH, 'Field', 'الحقل', { bold: true })
      drawCellBilingual(doc, left + col1, y, col2, rowH, 'Value', 'القيمة', { bold: true })
      y += rowH
    }
    drawCellBilingual(doc, left, y, col1, rowH, kEn, kAr, { bold: true })
    drawCellBilingual(doc, left + col1, y, col2, rowH, vEn, vAr)
    y += rowH
  }

  doc.setDrawColor(220)
  doc.line(left, pageH - 55, right, pageH - 55)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const supportWhatsApp = safe(process.env.NEXT_PUBLIC_WHATSAPP || '96877222432').replace(/\D/g, '')
  const siteUrl = safe(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const supportWhatsAppDisplay = supportWhatsApp.startsWith('968')
    ? `+968 ${supportWhatsApp.slice(3)}`
    : `+${supportWhatsApp}`

  if (audience === 'customer') {
    doc.text(`Support WhatsApp: ${supportWhatsAppDisplay}`, left, pageH - 35)
    doc.text(`My account: ${siteUrl}/profile`, left, pageH - 22)
  } else {
    doc.text(`Support WhatsApp: ${supportWhatsAppDisplay}`, left, pageH - 48)
    doc.text(`Admin panel: ${siteUrl}/admin/orders`, left, pageH - 35)
    doc.text(`Customer WhatsApp: https://wa.me/${order.customer_phone.replace(/\D/g, '')}`, left, pageH - 22)
  }

  doc.text(`Generated: ${new Date().toISOString()}`, right, pageH - 22, { align: 'right' })

  const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer
  return Buffer.from(arrayBuffer)
}

