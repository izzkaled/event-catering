import { eq } from 'drizzle-orm'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { orders, users, type Order } from '@/lib/db/schema'
import { formatPhoneDisplay } from '@/lib/constants'
import { buildInvoicePdfBuffer } from '@/lib/invoices/invoice-pdf'
import { emailLogoHtml } from '@/lib/email/brand-header'
import { getResendFromAddress } from '@/lib/email/send-otp-email'
import { escapeHtml } from '@/lib/security/escape-html'

export type OrderConfirmationEvent = 'created' | 'confirmed' | 'cancelled'

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
 * Sends customer + admin Resend emails (with PDF invoice) for an order event.
 * Safe to call fire-and-forget from order create / payment / admin status.
 */
export async function sendOrderConfirmation(input: {
  orderId: string
  event: OrderConfirmationEvent
}): Promise<SendOrderConfirmationResult> {
  const { orderId, event } = input
  const resendKey = process.env.RESEND_API_KEY?.trim()
  const adminEmail = process.env.ADMIN_EMAIL?.trim()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'
  const from = getResendFromAddress()

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  if (!order) {
    throw new Error('Order not found')
  }

  if (!resendKey) {
    console.warn('[sendOrderConfirmation] RESEND_API_KEY not set, skipping emails')
    return { success: true, skipped: true, customerEmailed: false, adminEmailed: false }
  }

  if (!adminEmail) {
    console.warn('[sendOrderConfirmation] ADMIN_EMAIL not set, skipping admin notifications')
  }

  const resend = new Resend(resendKey)
  const waLink = `https://wa.me/${order.customer_phone.replace(/\D/g, '')}`
  const customerEmail = await resolveCustomerEmail(order)
  const customerPhoneDisplay = formatPhoneDisplay(order.customer_phone)
  const isSameRecipient =
    Boolean(customerEmail && adminEmail) &&
    customerEmail!.toLowerCase() === adminEmail!.toLowerCase()

  const name = escapeHtml(order.customer_name)
  const orderNo = escapeHtml(order.order_number)
  const packageLabel = escapeHtml(
    order.package_name_ar ||
      order.package_name_en ||
      `${order.visits_per_week} ضيف | ${order.hours_per_visit} ساعة`,
  )
  const phoneHtml = escapeHtml(customerPhoneDisplay)
  const areaHtml = escapeHtml(order.customer_area)
  const emailHtml = escapeHtml(customerEmail)
  const priceHtml = escapeHtml(order.price_omr)
  const startHtml = escapeHtml(order.start_date)
  const guestsHtml = escapeHtml(String(order.visits_per_week))
  const notesHtml = escapeHtml((order.notes || '').slice(0, 500))
  const safeSite = escapeHtml(siteUrl)
  const safeWa = escapeHtml(whatsapp)

  if (event === 'cancelled') {
    const cancelHtml = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#2a1a2a">
        ${emailLogoHtml(siteUrl)}
        <h2 style="color:#4A234A">تم إلغاء الطلب</h2>
        <p>مرحباً ${name}،</p>
        <p>نود إعلامك بأنه تم <strong>إلغاء</strong> طلب الضيافة رقم <strong>${orderNo}</strong>.</p>
        <p><strong>الباقة:</strong> ${packageLabel}</p>
        <p>لم يتم استلام أي مبلغ مقابل هذا الطلب.</p>
        <p><a href="https://wa.me/${safeWa}" style="color:#4A234A">تواصل معنا على واتساب</a></p>
      </div>
    `

    const adminCancelHtml = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        ${emailLogoHtml(siteUrl)}
        <h2>تم إلغاء الطلب: ${orderNo}</h2>
        <p><strong>العميل:</strong> ${name} | <strong>الجوال:</strong> ${phoneHtml}</p>
        <p>تم إعلام العميل بالإلغاء. لم يُستلم أي مبلغ.</p>
        <p><a href="${safeSite}/admin/orders">عرض الطلبات</a></p>
      </div>
    `

    await Promise.all([
      customerEmail
        ? resend.emails.send({
            from,
            to: customerEmail,
            subject: `تم إلغاء طلبك ${order.order_number} | Event Catering`,
            html: cancelHtml,
          })
        : Promise.resolve(),
      isSameRecipient || !adminEmail
        ? Promise.resolve()
        : resend.emails.send({
            from,
            to: adminEmail,
            subject: `إلغاء طلب: ${order.order_number}`,
            html: adminCancelHtml,
          }),
    ])

    return {
      success: true,
      customerEmailed: Boolean(customerEmail),
      adminEmailed: Boolean(adminEmail) && !isSameRecipient,
    }
  }

  const isConfirmed = event === 'confirmed'
  const invoiceKind = isConfirmed ? 'confirmed' : 'requested'
  const filename = isConfirmed
    ? `invoice-confirmed-${order.order_number}.pdf`
    : `invoice-request-${order.order_number}.pdf`
  const customerAttachment = pdfAttachment(order, invoiceKind, filename, 'customer')
  const adminAttachment = pdfAttachment(order, invoiceKind, `admin-${filename}`, 'admin')

  const customerSubject = isConfirmed
    ? `تم تأكيد طلب الضيافة ${order.order_number} | Event Catering`
    : `تم استلام طلبك ${order.order_number} | Event Catering`

  const customerHtml = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#2a1a2a">
      ${emailLogoHtml(siteUrl)}
      <h2 style="color:#4A234A">${isConfirmed ? 'تم تأكيد طلبك' : 'تم استلام طلبك بنجاح'}</h2>
      <p>مرحباً ${name}،</p>
      <p><strong>رقم الطلب:</strong> ${orderNo}</p>
      <p><strong>الباقة:</strong> ${packageLabel}</p>
      <p><strong>الضيوف (تقديري):</strong> ${guestsHtml}</p>
      <p><strong>تاريخ المناسبة:</strong> ${startHtml}</p>
      <p><strong>التقدير الإجمالي:</strong> ${priceHtml} OMR</p>
      <p>${
        isConfirmed
          ? 'تم تأكيد العرض. سيتواصل معك فريقنا لتنسيق التفاصيل النهائية والدفع.'
          : 'استلمنا طلبك. سيراجعه فريق إيفنت كاترينج ويتواصل معك خلال 24 ساعة.'
      }</p>
      <p><a href="https://wa.me/${safeWa}" style="color:#4A234A">تواصل معنا على واتساب</a></p>
      <p><a href="${safeSite}/profile" style="color:#4A234A">حسابي</a></p>
      <p style="margin-top:16px;color:#666">الفاتورة PDF مرفقة في هذا البريد.</p>
    </div>
  `

  const adminSubject = isConfirmed
    ? `تأكيد طلب ضيافة: ${order.order_number}`
    : `طلب ضيافة جديد: ${order.order_number}`

  const adminHtml = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#2a1a2a">
      ${emailLogoHtml(siteUrl)}
      <h2 style="color:#4A234A">${isConfirmed ? 'تم تأكيد طلب' : 'طلب ضيافة جديد'}: ${orderNo}</h2>
      <p><strong>الاسم:</strong> ${name} | <strong>الجوال:</strong> ${phoneHtml} | <strong>المنطقة:</strong> ${areaHtml}</p>
      ${customerEmail ? `<p><strong>إيميل العميل:</strong> ${emailHtml}</p>` : ''}
      <p><strong>الباقة:</strong> ${packageLabel}</p>
      <p><strong>الضيوف:</strong> ${guestsHtml} | <strong>التاريخ:</strong> ${startHtml}</p>
      <p><strong>التقدير:</strong> ${priceHtml} OMR</p>
      ${notesHtml ? `<p style="white-space:pre-wrap;background:#f8f4f0;padding:12px;border-radius:8px"><strong>ملخص الطلب:</strong><br/>${notesHtml}</p>` : ''}
      <p><a href="${escapeHtml(waLink)}">واتساب العميل</a></p>
      <p><a href="${safeSite}/admin/orders">لوحة التحكم — الطلبات</a></p>
      <p style="margin-top:16px;color:#666">الفاتورة PDF مرفقة (${isConfirmed ? 'مؤكدة' : 'طلب جديد'}).</p>
    </div>
  `

  const sends: Promise<unknown>[] = []

  if (customerEmail) {
    sends.push(
      resend.emails.send({
        from,
        to: customerEmail,
        subject: customerSubject,
        html: customerHtml,
        attachments: [customerAttachment],
      }),
    )
  }

  if (!isSameRecipient && adminEmail) {
    sends.push(
      resend.emails.send({
        from,
        to: adminEmail,
        subject: adminSubject,
        html: adminHtml,
        attachments: [adminAttachment],
      }),
    )
  }

  await Promise.all(sends)

  return {
    success: true,
    customerEmailed: Boolean(customerEmail),
    adminEmailed: Boolean(adminEmail) && !isSameRecipient,
  }
}
