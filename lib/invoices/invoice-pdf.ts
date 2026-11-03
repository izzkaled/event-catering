import type { Order } from '@/lib/db/schema'
import { resolvePublicSiteUrl } from '@/lib/seo'
import {
  loadInvoiceFonts,
  resolveArabicFontPath,
  resolveLatinFontPath,
  writeShaped,
  type FontPair,
  type ShapedTextOptions,
} from '@/lib/invoices/shaped-text'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PassThrough } from 'node:stream'
import PDFDocument from 'pdfkit'

type InvoiceKind = 'requested' | 'confirmed'
type InvoiceAudience = 'customer' | 'admin'

const INK = '#2a122a'
const MUTED = '#6b625c'
const BRAND = '#4a234a'
const SAND = '#a87c2d'
const LINE = '#e4dcd4'
const PAPER = '#fcf9f5'
const SOFT = '#f7f1e7'

const DAY_AR: Record<string, string> = {
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
  saturday: 'السبت',
}

type Row = { label: string; value: string }

function safe(v: unknown) {
  return String(v ?? '').trim()
}

function formatOmr(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return safe(v) || '—'
  return `OMR ${n.toFixed(3)}`
}

function formatDate(isoLike: string) {
  const raw = safe(isoLike)
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function payLabel(status: string, paid: boolean) {
  if (paid) return { en: 'Paid', ar: 'مدفوع' }
  const map: Record<string, { en: string; ar: string }> = {
    unpaid: { en: 'Unpaid', ar: 'غير مدفوع' },
    pending_verification: { en: 'Pending', ar: 'بانتظار التحقق' },
    failed: { en: 'Failed', ar: 'فشل الدفع' },
    refunded: { en: 'Refunded', ar: 'مسترد' },
    partially_refunded: { en: 'Partial refund', ar: 'مسترد جزئياً' },
  }
  return map[status] || { en: safe(status) || '—', ar: safe(status) || '—' }
}

function orderStatusLabel(status: string, kind: InvoiceKind) {
  const map: Record<string, { en: string; ar: string }> = {
    pending: { en: 'Under review', ar: 'قيد المراجعة' },
    confirmed: { en: 'Confirmed', ar: 'مؤكد' },
    active: { en: 'In progress', ar: 'قيد التنفيذ' },
    cancelled: { en: 'Cancelled', ar: 'ملغي' },
    completed: { en: 'Completed', ar: 'مكتمل' },
  }
  return (
    map[status] || {
      en: kind === 'confirmed' ? 'Confirmed' : 'Under review',
      ar: kind === 'confirmed' ? 'مؤكد' : 'قيد المراجعة',
    }
  )
}

function paymentMethodLabel(method: string, channel: string) {
  const raw = [safe(method), safe(channel)].filter(Boolean).join(' ')
  const key = raw.toLowerCase()
  if (/bank|تحويل/.test(key)) return { ar: 'تحويل بنكي', en: 'Bank transfer' }
  if (/card|visa|master|بطاقة/.test(key)) return { ar: 'بطاقة', en: 'Card' }
  if (/cash|نقد/.test(key)) return { ar: 'نقداً', en: 'Cash' }
  if (/online|إلكتروني/.test(key)) return { ar: 'دفع إلكتروني', en: 'Online' }
  if (!raw) return { ar: '—', en: '—' }
  return { ar: raw, en: raw }
}

function translateDay(day: string) {
  const key = day.trim().toLowerCase()
  return DAY_AR[key] || day
}

function supportWhatsAppDisplay() {
  const raw = safe(process.env.NEXT_PUBLIC_WHATSAPP || '96897021006').replace(/\D/g, '')
  return raw.startsWith('968') ? `+968 ${raw.slice(3)}` : `+${raw}`
}

function siteUrl() {
  return resolvePublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
}

function packageNameAr(order: Order) {
  return safe(order.package_name_ar) || safe(order.package_name_en) || '—'
}

function packageNameEn(order: Order) {
  return safe(order.package_name_en) || safe(order.package_name_ar) || '—'
}

function locationAr(order: Order) {
  return [safe(order.customer_area), safe(order.customer_address)].filter(Boolean).join(' — ') || '—'
}

function daysAr(order: Order) {
  return (order.preferred_days || []).filter(Boolean).map(translateDay).join(' · ')
}

function createPdfDoc(title: string) {
  const arabicFontPath = resolveArabicFontPath()
  const latinFontPath = resolveLatinFontPath()
  if (!arabicFontPath || !latinFontPath) {
    throw new Error('Invoice fonts missing under public/fonts')
  }

  const fonts = loadInvoiceFonts()
  const doc = new PDFDocument({
    size: 'A4',
    margin: 48,
    font: latinFontPath,
    info: { Title: title },
  })
  const stream = new PassThrough()
  const chunks: Buffer[] = []
  stream.on('data', (chunk: Buffer) => chunks.push(chunk))

  const done = new Promise<Buffer>((resolve, reject) => {
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
    doc.on('error', reject)
  })

  doc.pipe(stream)
  doc.registerFont('EventLatin', latinFontPath)
  doc.registerFont('EventArabic', arabicFontPath)
  doc.font('EventLatin')

  return { doc, fonts, done, latinFontPath }
}

function drawBrandMark(doc: PDFKit.PDFDocument, x: number, y: number) {
  const logoPath = join(process.cwd(), 'public', 'images', 'brand', 'logo-mark.webp')
  if (existsSync(logoPath)) {
    try {
      doc.image(logoPath, x, y, { width: 28, height: 28, fit: [28, 28] })
      return
    } catch {
      /* fall through to mark */
    }
  }
  doc.save()
  doc.fillColor(BRAND).circle(x + 14, y + 14, 13).fill()
  doc.fillColor('#ffffff').fontSize(11)
  doc.text('E', x + 9, y + 8, { width: 10, align: 'center' })
  doc.restore()
}

type Writer = {
  doc: PDFKit.PDFDocument
  fonts: FontPair
  size: number
  setSize: (n: number) => void
  write: (value: string, x: number, y: number, options?: ShapedTextOptions) => number
  pageW: number
  pageH: number
  left: number
  right: number
}

function makeWriter(doc: PDFKit.PDFDocument, fonts: FontPair): Writer {
  let size = 11
  const pageW = doc.page.width
  const pageH = doc.page.height
  const left = 48
  const right = pageW - 48
  return {
    doc,
    fonts,
    get size() {
      return size
    },
    setSize(n: number) {
      size = n
      doc.fontSize(n)
    },
    write(value, x, y, options) {
      return writeShaped(doc, fonts, value, x, y, size, options)
    },
    pageW,
    pageH,
    left,
    right,
  }
}

function ensureY(w: Writer, y: number, need: number) {
  if (y + need < w.pageH - 72) return y
  w.doc.addPage()
  w.doc.font('EventLatin')
  return 48
}

function drawChrome(
  w: Writer,
  opts: {
    titleAr: string
    orderNumber: string
    statusAr: string
    issued: string
    internal?: boolean
  },
) {
  const { doc, left, right, pageW } = w

  doc.rect(0, 0, pageW, 92).fill(PAPER)
  doc.rect(0, 0, pageW, 3).fill(SAND)

  drawBrandMark(doc, left, 22)

  doc.fillColor(BRAND)
  w.setSize(13)
  w.write('Event Catering', left + 36, 30)

  doc.fillColor(MUTED)
  w.setSize(9)
  w.write(opts.internal ? 'نسخة داخلية - مسقط، عمان' : 'ضيافة مناسبات - مسقط، عمان', left + 36, 48)

  doc.fillColor(BRAND)
  w.setSize(18)
  w.write(opts.titleAr, right, 28, { align: 'right' })

  doc
    .moveTo(left, 86)
    .lineTo(right, 86)
    .strokeColor(LINE)
    .lineWidth(0.6)
    .stroke()

  doc.fillColor(INK)
  w.setSize(11)
  w.write(opts.orderNumber || '—', left, 100)

  doc.fillColor(MUTED)
  w.setSize(9)
  w.write(`تاريخ الإصدار: ${opts.issued}`, left, 116)

  doc.fillColor(BRAND)
  w.setSize(12)
  w.write(opts.statusAr, right, 104, { align: 'right' })

  return 142
}

function drawSection(w: Writer, y: number, title: string) {
  const { doc, left, right } = w
  doc.fillColor(BRAND)
  w.setSize(12)
  w.write(title, right, y, { align: 'right' })
  doc
    .moveTo(left, y + 8)
    .lineTo(right, y + 8)
    .strokeColor(LINE)
    .lineWidth(0.5)
    .stroke()
  return y + 22
}

function drawRows(w: Writer, y: number, rows: Row[]) {
  const { doc, left, right } = w
  const labelWidth = 120
  const valueWidth = right - left - labelWidth - 12

  for (const row of rows) {
    if (!row.value || row.value === '—') continue
    y = ensureY(w, y, 28)

    doc.fillColor(MUTED)
    w.setSize(10)
    w.write(row.label, right, y, { align: 'right' })

    doc.fillColor(INK)
    w.setSize(11)
    const h = w.write(row.value, left, y, { width: valueWidth })
    y += Math.max(14, h) + 10
  }
  return y
}

function drawAmountCard(w: Writer, y: number, label: string, amount: string) {
  const { doc, left, right } = w
  const h = 56
  doc.roundedRect(left, y, right - left, h, 8).fill(SOFT)
  doc.roundedRect(left, y, right - left, h, 8).strokeColor(LINE).lineWidth(0.6).stroke()

  doc.fillColor(MUTED)
  w.setSize(11)
  w.write(label, right - 16, y + 16, { align: 'right' })

  doc.fillColor(BRAND)
  w.setSize(18)
  w.write(amount, left + 16, y + 28)

  return y + h + 18
}

function drawMoneyRows(
  w: Writer,
  xLeft: number,
  xRight: number,
  y: number,
  rows: { label: string; value: string; strong?: boolean }[],
) {
  for (const row of rows) {
    w.doc.fillColor(row.strong ? BRAND : MUTED)
    w.setSize(row.strong ? 12 : 10)
    w.write(row.label, xRight, y, { align: 'right' })

    w.doc.fillColor(INK)
    w.write(row.value, xLeft, y)
    y += row.strong ? 18 : 15
  }
  return y
}

function drawFooter(w: Writer, note: string, metaLeft: string[]) {
  const { doc, left, right, pageH } = w
  doc
    .moveTo(left, pageH - 54)
    .lineTo(right, pageH - 54)
    .strokeColor(LINE)
    .lineWidth(0.5)
    .stroke()

  doc.fillColor(BRAND)
  w.setSize(10)
  w.write(note, right, pageH - 40, { align: 'right' })

  doc.fillColor(MUTED)
  w.setSize(8)
  let fy = pageH - 42
  for (const line of metaLeft) {
    w.write(line, left, fy)
    fy += 11
  }
}

async function buildCustomerPdf(order: Order, kind: InvoiceKind): Promise<Buffer> {
  const paid = order.payment_status === 'paid'
  const pay = payLabel(order.payment_status, paid)
  const status = orderStatusLabel(order.status, kind)
  const issued = formatDate(new Date().toISOString())
  const { doc, fonts, done } = createPdfDoc(`Order ${safe(order.order_number)}`)
  const w = makeWriter(doc, fonts)

  let y = drawChrome(w, {
    titleAr: paid ? 'فاتورة' : 'ملخص الطلب',
    orderNumber: safe(order.order_number),
    statusAr: paid ? pay.ar : status.ar,
    issued,
  })

  y = drawSection(w, y, 'بيانات العميل')
  y = drawRows(w, y, [
    { label: 'الاسم', value: safe(order.customer_name) },
    { label: 'الجوال', value: safe(order.customer_phone) },
    { label: 'البريد', value: safe(order.customer_email) },
  ])

  y += 4
  y = drawSection(w, y, 'تفاصيل المناسبة')
  const days = daysAr(order)
  y = drawRows(w, y, [
    { label: 'الباقة', value: packageNameAr(order) },
    { label: 'عدد الضيوف', value: String(order.visits_per_week || '—') },
    { label: 'مدة الخدمة (ساعات)', value: String(order.hours_per_visit || '—') },
    { label: 'تاريخ المناسبة', value: formatDate(safe(order.start_date)) },
    { label: 'الوقت', value: safe(order.preferred_time) },
    ...(days ? [{ label: 'اليوم', value: days }] : []),
    { label: 'الموقع', value: locationAr(order) },
  ])

  y = ensureY(w, y, 70)
  y = drawAmountCard(w, y, paid ? 'المبلغ المدفوع' : 'التقدير الإجمالي', formatOmr(order.price_omr))

  const brief = safe(order.notes)
  if (brief) {
    y = ensureY(w, y, 70)
    y = drawSection(w, y, 'ملاحظات')
    doc.fillColor(INK)
    w.setSize(11)
    w.write(brief.slice(0, 700), w.left, y, { width: w.right - w.left, align: 'right' })
  }

  drawFooter(
    w,
    paid ? 'شكراً لثقتك بإيفنت كاترينج' : 'سيتواصل معك فريقنا خلال 24 ساعة',
    [`WhatsApp ${supportWhatsAppDisplay()}`, siteUrl()],
  )

  doc.end()
  return done
}

async function buildAdminPdf(order: Order, kind: InvoiceKind): Promise<Buffer> {
  const paid = order.payment_status === 'paid'
  const pay = payLabel(order.payment_status, paid)
  const status = orderStatusLabel(order.status, kind)
  const payMethod = paymentMethodLabel(safe(order.payment_method), safe(order.payment_channel))
  const phoneDigits = safe(order.customer_phone).replace(/\D/g, '')
  const issued = formatDate(new Date().toISOString())
  const { doc, fonts, done } = createPdfDoc(`Admin ${safe(order.order_number)}`)
  const w = makeWriter(doc, fonts)

  let y = drawChrome(w, {
    titleAr: 'تفاصيل الطلب',
    orderNumber: safe(order.order_number),
    statusAr: `${status.ar} - ${pay.ar}`,
    issued,
    internal: true,
  })

  y = drawSection(w, y, 'بيانات العميل')
  y = drawRows(w, y, [
    { label: 'الاسم', value: safe(order.customer_name) },
    { label: 'الجوال', value: safe(order.customer_phone) },
    { label: 'البريد', value: safe(order.customer_email) },
    { label: 'المنطقة', value: safe(order.customer_area) },
    { label: 'العنوان', value: safe(order.customer_address) },
  ])

  y += 4
  y = drawSection(w, y, 'تفاصيل الطلب')
  const days = daysAr(order)
  y = drawRows(w, y, [
    { label: 'الباقة', value: packageNameAr(order) },
    { label: 'الباقة (EN)', value: packageNameEn(order) },
    { label: 'عدد الضيوف', value: String(order.visits_per_week || '—') },
    { label: 'مدة الخدمة (ساعات)', value: String(order.hours_per_visit || '—') },
    { label: 'تاريخ المناسبة', value: formatDate(safe(order.start_date)) },
    { label: 'الوقت', value: safe(order.preferred_time) },
    ...(days ? [{ label: 'اليوم', value: days }] : []),
  ])

  y = ensureY(w, y, 110)
  y = drawSection(w, y, 'الملخص المالي')

  doc.roundedRect(w.left, y, w.right - w.left, 86, 8).fill(SOFT)
  drawMoneyRows(w, w.left + 16, w.right - 16, y + 22, [
    { label: 'الإجمالي التقديري', value: formatOmr(order.price_omr), strong: true },
    { label: 'عمولة المنصة', value: formatOmr(order.commission_omr) },
    { label: 'صافي الإيراد', value: formatOmr(order.net_revenue_omr) },
    { label: 'طريقة الدفع', value: payMethod.ar },
  ])
  y += 100

  if (order.payment_card_last4) {
    y = drawRows(w, y, [{ label: 'آخر 4 أرقام للبطاقة', value: `**** ${order.payment_card_last4}` }])
  }
  if (order.payment_reference) {
    y = drawRows(w, y, [{ label: 'مرجع الدفع', value: safe(order.payment_reference) }])
  }

  const notes = safe(order.notes)
  if (notes) {
    y = ensureY(w, y, 70)
    y = drawSection(w, y, 'ملاحظات العميل')
    doc.fillColor(INK)
    w.setSize(10)
    const h = w.write(notes, w.left, y, { width: w.right - w.left, align: 'right' })
    y += h + 8
  }

  if (order.verification_notes) {
    y = ensureY(w, y, 60)
    y = drawSection(w, y, 'ملاحظات التحقق')
    doc.fillColor(INK)
    w.setSize(10)
    w.write(safe(order.verification_notes), w.left, y, {
      width: w.right - w.left,
      align: 'right',
    })
  }

  drawFooter(w, 'نسخة داخلية للفريق', [
    `${siteUrl()}/admin/orders`,
    phoneDigits ? `wa.me/${phoneDigits}` : `WhatsApp ${supportWhatsAppDisplay()}`,
  ])

  doc.end()
  return done
}

export async function buildInvoicePdfBuffer(
  order: Order,
  kind: InvoiceKind,
  audience: InvoiceAudience = 'customer',
): Promise<Buffer> {
  return audience === 'admin' ? buildAdminPdf(order, kind) : buildCustomerPdf(order, kind)
}
