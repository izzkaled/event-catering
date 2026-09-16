import { eq } from 'drizzle-orm'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { orders, users, type Order } from '@/lib/db/schema'
import { formatPhoneDisplay, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants'
import { buildInvoicePdfBuffer } from '@/lib/invoices/invoice-pdf'
import { emailLogoHtml } from '@/lib/email/brand-header'
import { getResendFromAddress } from '@/lib/email/send-otp-email'
import { escapeHtml } from '@/lib/security/escape-html'
import { SITE_URL } from '@/lib/seo'

export type OrderConfirmationEvent =
  | 'created'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'paid'
  | 'payment_pending'
  | 'payment_failed'

export const ORDER_EMAIL_EVENTS: OrderConfirmationEvent[] = [
  'created',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'paid',
  'payment_pending',
  'payment_failed',
]

export function isOrderEmailEvent(value: string): value is OrderConfirmationEvent {
  return (ORDER_EMAIL_EVENTS as string[]).includes(value)
}

function statusLabel(order: Order) {
  return ORDER_STATUS_LABELS[order.status] || { ar: order.status, en: order.status }
}

function paymentLabel(order: Order) {
  return PAYMENT_STATUS_LABELS[order.payment_status] || { ar: order.payment_status, en: order.payment_status }
}

function pdfKind(order: Order, event: OrderConfirmationEvent): 'requested' | 'confirmed' {
  if (event === 'paid' || event === 'confirmed' || event === 'active' || event === 'completed') {
    return 'confirmed'
  }
  if (order.payment_status === 'paid' || order.status === 'confirmed' || order.status === 'active') {
    return 'confirmed'
  }
  return 'requested'
}

function shouldAttachPdf(event: OrderConfirmationEvent) {
  return event !== 'cancelled' && event !== 'payment_failed'
}

function notifyAdmin(event: OrderConfirmationEvent) {
  return (
    event === 'created' ||
    event === 'cancelled' ||
    event === 'paid' ||
    event === 'payment_pending' ||
    event === 'payment_failed'
  )
}

function eventCopy(event: OrderConfirmationEvent, orderNo: string) {
  switch (event) {
    case 'created':
      return {
        customerSubject: `تم استلام طلبك ${orderNo} | Event Catering`,
        customerTitle: 'تم استلام طلبك بنجاح',
        customerBody:
          'استلمنا طلب الضيافة. سيراجعه فريق إيفنت كاترينج ويتواصل معك خلال 24 ساعة. الفاتورة PDF مرفقة (غير مدفوعة حالياً).',
        adminSubject: `طلب ضيافة جديد: ${orderNo}`,
        adminTitle: 'طلب ضيافة جديد',
      }
    case 'confirmed':
      return {
        customerSubject: `تم تأكيد عرضك ${orderNo} | Event Catering`,
        customerTitle: 'تم تأكيد العرض',
        customerBody: 'تم تأكيد عرض الضيافة. سيتواصل معك الفريق لتنسيق التفاصيل والدفع إن لزم.',
        adminSubject: `تأكيد عرض: ${orderNo}`,
        adminTitle: 'تم تأكيد العرض',
      }
    case 'active':
      return {
        customerSubject: `طلبك قيد التنفيذ ${orderNo} | Event Catering`,
        customerTitle: 'طلبك قيد التنفيذ',
        customerBody: 'بدأ تنفيذ طلب الضيافة. نتابع التفاصيل معك حتى يوم المناسبة.',
        adminSubject: `قيد التنفيذ: ${orderNo}`,
        adminTitle: 'الطلب قيد التنفيذ',
      }
    case 'completed':
      return {
        customerSubject: `اكتمل طلبك ${orderNo} | Event Catering`,
        customerTitle: 'تم إكمال الطلب',
        customerBody: 'اكتملت خدمة الضيافة لهذا الطلب. شكراً لثقتك بإيفنت كاترينج.',
        adminSubject: `مكتمل: ${orderNo}`,
        adminTitle: 'تم إكمال الطلب',
      }
    case 'cancelled':
      return {
        customerSubject: `تم إلغاء طلبك ${orderNo} | Event Catering`,
        customerTitle: 'تم إلغاء الطلب',
        customerBody: 'تم إلغاء طلب الضيافة. لم يُستلم أي مبلغ مقابل هذا الطلب إن لم يكن مدفوعاً مسبقاً.',
        adminSubject: `إلغاء طلب: ${orderNo}`,
        adminTitle: 'تم إلغاء الطلب',
      }
    case 'paid':
      return {
        customerSubject: `تم تأكيد الدفع ${orderNo} | Event Catering`,
        customerTitle: 'تم الدفع بنجاح',
        customerBody: 'استلمنا الدفع. فاتورة مدفوعة PDF مرفقة بهذا البريد.',
        adminSubject: `دفع مؤكد: ${orderNo}`,
        adminTitle: 'تم تأكيد الدفع',
      }
    case 'payment_pending':
      return {
        customerSubject: `بانتظار التحقق من التحويل ${orderNo} | Event Catering`,
        customerTitle: 'استلمنا إيصال التحويل',
        customerBody: 'إيصال التحويل البنكي قيد المراجعة. سنُعلمك فور التحقق.',
        adminSubject: `تحويل بانتظار التحقق: ${orderNo}`,
        adminTitle: 'تحويل بنكي بانتظار التحقق',
      }
    case 'payment_failed':
      return {
        customerSubject: `تعذر التحقق من الدفع ${orderNo} | Event Catering`,
        customerTitle: 'تعذر التحقق من الدفع',
        customerBody:
          'لم نتمكن من التحقق من الدفع/التحويل. يرجى إعادة المحاولة أو رفع إيصال أوضح، أو التواصل معنا.',
        adminSubject: `فشل دفع: ${orderNo}`,
        adminTitle: 'فشل / رفض الدفع',
      }
  }
}

function pdfAttachment(
  order: Order,
  kind: 'requested' | 'confirmed',
  filename: string,
  audience: 'customer' | 'admin',
) {
  return {
    filename,
    content: buildInvoicePdfBuffer(order, kind, audience).toString('base64'),
    contentType: 'application/pdf' as const,
  }
}

async function resolveCustomerEmail(order: Order): Promise<string | null> {
  let email = order.customer_email?.trim() || null
  if (!email && order.user_id) {
    const [profile] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, order.user_id))
      .limit(1)
    email = profile?.email?.trim() || null
  }
  return email
}

export type SendOrderConfirmationResult = {
  success: true
  skipped?: boolean
  customerEmailed: boolean
  adminEmailed: boolean
}

/**
 * Sends customer (+ optional admin) Resend emails with PDF invoice for order events.
 */
export async function sendOrderConfirmation(input: {
  orderId: string
  event: OrderConfirmationEvent
}): Promise<SendOrderConfirmationResult> {
  const { orderId, event } = input
  const resendKey = process.env.RESEND_API_KEY?.trim()
  const adminEmail = process.env.ADMIN_EMAIL?.trim()
  const siteUrl = SITE_URL
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'
  const from = getResendFromAddress()

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) throw new Error('Order not found')

  if (!resendKey) {
    console.warn('[sendOrderConfirmation] RESEND_API_KEY not set, skipping emails')
    return { success: true, skipped: true, customerEmailed: false, adminEmailed: false }
  }

  const resend = new Resend(resendKey)
  const customerEmail = await resolveCustomerEmail(order)
  const isSameRecipient =
    Boolean(customerEmail && adminEmail) &&
    customerEmail!.toLowerCase() === adminEmail!.toLowerCase()

  const name = escapeHtml(order.customer_name)
  const orderNo = escapeHtml(order.order_number)
  const packageLabel = escapeHtml(
    order.package_name_ar || order.package_name_en || `${order.visits_per_week} ضيف`,
  )
  const phoneHtml = escapeHtml(formatPhoneDisplay(order.customer_phone))
  const areaHtml = escapeHtml(order.customer_area)
  const emailHtml = escapeHtml(customerEmail)
  const priceHtml = escapeHtml(order.price_omr)
  const startHtml = escapeHtml(order.start_date)
  const guestsHtml = escapeHtml(String(order.visits_per_week))
  const notesHtml = escapeHtml((order.notes || '').slice(0, 500))
  const statusAr = escapeHtml(statusLabel(order).ar)
  const payAr = escapeHtml(paymentLabel(order).ar)
  const safeSite = escapeHtml(siteUrl)
  const safeWa = escapeHtml(whatsapp)
  const waLink = `https://wa.me/${order.customer_phone.replace(/\D/g, '')}`
  const copy = eventCopy(event, order.order_number)

  const statusBox = `
    <p style="background:#f8f4f0;border-radius:8px;padding:12px;line-height:1.7">
      <strong>حالة الطلب:</strong> ${statusAr}<br/>
      <strong>حالة الدفع:</strong> ${payAr}<br/>
      <strong>التقدير:</strong> ${priceHtml} OMR
    </p>
  `

  const customerHtml = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#2a1a2a">
      ${emailLogoHtml(siteUrl)}
      <h2 style="color:#4A234A">${copy.customerTitle}</h2>
      <p>مرحباً ${name}،</p>
      <p><strong>رقم الطلب:</strong> ${orderNo}</p>
      <p><strong>الباقة:</strong> ${packageLabel}</p>
      <p><strong>الضيوف:</strong> ${guestsHtml} | <strong>التاريخ:</strong> ${startHtml}</p>
      ${statusBox}
      <p>${copy.customerBody}</p>
      <p><a href="https://wa.me/${safeWa}" style="color:#4A234A">واتساب الدعم</a>
         · <a href="${safeSite}/profile" style="color:#4A234A">حسابي</a></p>
      ${shouldAttachPdf(event) ? '<p style="margin-top:16px;color:#666">الفاتورة PDF مرفقة.</p>' : ''}
    </div>
  `

  const adminHtml = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#2a1a2a">
      ${emailLogoHtml(siteUrl)}
      <h2 style="color:#4A234A">${copy.adminTitle}: ${orderNo}</h2>
      <p><strong>العميل:</strong> ${name} | <strong>الجوال:</strong> ${phoneHtml} | <strong>المنطقة:</strong> ${areaHtml}</p>
      ${customerEmail ? `<p><strong>الإيميل:</strong> ${emailHtml}</p>` : ''}
      <p><strong>الباقة:</strong> ${packageLabel}</p>
      ${statusBox}
      ${notesHtml ? `<p style="white-space:pre-wrap;background:#f8f4f0;padding:12px;border-radius:8px">${notesHtml}</p>` : ''}
      <p><a href="${escapeHtml(waLink)}">واتساب العميل</a> · <a href="${safeSite}/admin/orders">الطلبات</a></p>
    </div>
  `

  const kind = pdfKind(order, event)
  const filename =
    event === 'paid'
      ? `invoice-paid-${order.order_number}.pdf`
      : `invoice-${event}-${order.order_number}.pdf`

  const attachments = shouldAttachPdf(event)
    ? [pdfAttachment(order, kind, filename, 'customer')]
    : undefined
  const adminAttachments = shouldAttachPdf(event)
    ? [pdfAttachment(order, kind, `admin-${filename}`, 'admin')]
    : undefined

  const sends: Promise<unknown>[] = []

  if (customerEmail) {
    sends.push(
      resend.emails.send({
        from,
        to: customerEmail,
        subject: copy.customerSubject,
        html: customerHtml,
        attachments,
      }),
    )
  }

  if (notifyAdmin(event) && adminEmail && !isSameRecipient) {
    sends.push(
      resend.emails.send({
        from,
        to: adminEmail,
        subject: copy.adminSubject,
        html: adminHtml,
        attachments: adminAttachments,
      }),
    )
  }

  await Promise.all(sends)

  return {
    success: true,
    customerEmailed: Boolean(customerEmail),
    adminEmailed: notifyAdmin(event) && Boolean(adminEmail) && !isSameRecipient,
  }
}

/** Map admin status change → email event */
export function eventFromOrderStatus(
  status: string,
): Extract<OrderConfirmationEvent, 'confirmed' | 'active' | 'completed' | 'cancelled' | 'created'> | null {
  if (status === 'pending') return 'created'
  if (status === 'confirmed') return 'confirmed'
  if (status === 'active') return 'active'
  if (status === 'completed') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  return null
}
