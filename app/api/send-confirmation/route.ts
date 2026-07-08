import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { orders, users } from '@/lib/db/schema'
import { formatPhoneDisplay } from '@/lib/constants'
import { buildInvoicePdfBuffer } from '@/lib/invoices/invoice-pdf'
import type { Order } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

type InvoiceEvent = 'created' | 'confirmed' | 'cancelled'

function pdfAttachment(order: Order, kind: 'requested' | 'confirmed', filename: string) {
  return {
    filename,
    content: buildInvoicePdfBuffer(order, kind).toString('base64'),
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

export async function POST(request: Request) {
  try {
    const { orderId, event } = (await request.json().catch(() => null)) as
      | { orderId?: string; event?: InvoiceEvent }
      | null
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    const adminEmail = process.env.ADMIN_EMAIL || 'Izzkaled@gmail.com'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const adminToken = process.env.ADMIN_SECRET_TOKEN || ''
    const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'
    const from = process.env.RESEND_FROM_EMAIL?.trim() || 'Speedy Cleaning <onboarding@resend.dev>'

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!resendKey) {
      console.warn('RESEND_API_KEY not set, skipping emails')
      return NextResponse.json({ success: true, skipped: true })
    }

    const resend = new Resend(resendKey)
    const phone = formatPhoneDisplay(order.customer_phone)
    const waLink = `https://wa.me/${order.customer_phone.replace(/\D/g, '')}`
    const customerEmail = await resolveCustomerEmail(order)

    if (event === 'cancelled') {
      const cancelHtml = `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2>تم إلغاء الطلب</h2>
          <p>مرحباً ${order.customer_name}،</p>
          <p>نود إعلامك بأنه تم <strong>إلغاء</strong> طلب الاشتراك رقم <strong>${order.order_number}</strong>.</p>
          <p><strong>الباقة:</strong> ${order.package_name_ar || `${order.hours_per_visit} ساعة | ${order.visits_per_week} زيارة/أسبوع`}</p>
          <p>لم يتم استلام أي مبلغ مقابل هذا الطلب.</p>
          <p><a href="https://wa.me/${whatsapp}">تواصل معنا على واتساب</a></p>
        </div>
      `

      const adminCancelHtml = `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2>❌ تم إلغاء الطلب: ${order.order_number}</h2>
          <p><strong>العميل:</strong> ${order.customer_name} | <strong>الجوال:</strong> ${phone}</p>
          <p>تم إعلام العميل بالإلغاء. لم يُستلم أي مبلغ.</p>
          <p><a href="${siteUrl}/admin/orders">عرض الطلبات</a></p>
        </div>
      `

      await Promise.all([
        customerEmail
          ? resend.emails.send({
              from,
              to: customerEmail,
              subject: `تم إلغاء طلبك ${order.order_number} | Speedy Cleaning`,
              html: cancelHtml,
            })
          : Promise.resolve(),
        resend.emails.send({
          from,
          to: adminEmail,
          subject: `❌ إلغاء طلب: ${order.order_number}`,
          html: adminCancelHtml,
        }),
      ])

      return NextResponse.json({
        success: true,
        customerEmailed: Boolean(customerEmail),
        adminEmailed: true,
      })
    }

    const isConfirmed = event === 'confirmed'
    const invoiceKind = isConfirmed ? 'confirmed' : 'requested'
    const filename = isConfirmed
      ? `invoice-confirmed-${order.order_number}.pdf`
      : `invoice-requested-${order.order_number}.pdf`
    const attachment = pdfAttachment(order, invoiceKind, filename)

    const customerSubject = isConfirmed
      ? `تم تأكيد اشتراكك ${order.order_number} | Speedy Cleaning`
      : `تم استلام طلب اشتراكك ${order.order_number} | Speedy Cleaning`

    const customerHtml = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>${isConfirmed ? 'تم تأكيد اشتراكك ✅' : 'تم استلام طلبك بنجاح! 🎉'}</h2>
        <p><strong>رقم الطلب:</strong> ${order.order_number}</p>
        <p><strong>الباقة:</strong> ${order.hours_per_visit} ساعة | ${order.visits_per_week} زيارة/أسبوع | ${order.visits_per_month} زيارة/شهر</p>
        <p><strong>الإجمالي:</strong> ${order.price_omr} OMR</p>
        <p>${
          isConfirmed
            ? 'تم تأكيد الحجز. ستبدأ الزيارات حسب الجدول المتفق عليه.'
            : `سيتواصل معك فريقنا على رقم ${phone} خلال 24 ساعة.`
        }</p>
        <p><a href="https://wa.me/${whatsapp}">تواصل معنا على واتساب</a></p>
        <p style="margin-top:16px">الفاتورة PDF مرفقة في البريد.</p>
      </div>
    `

    const adminSubject = isConfirmed
      ? `✅ تأكيد اشتراك: ${order.order_number}`
      : `🆕 طلب اشتراك جديد: ${order.order_number}`

    const adminHtml = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>${isConfirmed ? '✅ تم تأكيد اشتراك' : '🆕 طلب اشتراك جديد'}: ${order.order_number}</h2>
        <p><strong>الاسم:</strong> ${order.customer_name} | <strong>الجوال:</strong> ${phone} | <strong>المنطقة:</strong> ${order.customer_area}</p>
        ${customerEmail ? `<p><strong>إيميل العميل:</strong> ${customerEmail}</p>` : ''}
        <p><strong>الباقة:</strong> ${order.hours_per_visit} ساعة / ${order.visits_per_week} زيارة أسبوعياً / ${order.visits_per_month} زيارة شهرياً</p>
        <p><strong>السعر الإجمالي:</strong> ${order.price_omr} OMR</p>
        <p><strong>تاريخ البداية:</strong> ${order.start_date}</p>
        <p><a href="${waLink}">واتساب العميل</a></p>
        <p><a href="${siteUrl}/admin/orders${adminToken ? `?token=${adminToken}` : ''}">لوحة التحكم</a></p>
        <p style="margin-top:16px">الفاتورة PDF مرفقة (${isConfirmed ? 'مؤكدة' : 'بانتظار التأكيد'}).</p>
      </div>
    `

    await Promise.all([
      customerEmail
        ? resend.emails.send({
            from,
            to: customerEmail,
            subject: customerSubject,
            html: customerHtml,
            attachments: [attachment],
          })
        : Promise.resolve(),
      resend.emails.send({
        from,
        to: adminEmail,
        subject: adminSubject,
        html: adminHtml,
        attachments: [attachment],
      }),
    ])

    return NextResponse.json({
      success: true,
      customerEmailed: Boolean(customerEmail),
      adminEmailed: true,
    })
  } catch (error) {
    console.error('POST /api/send-confirmation:', error)
    return NextResponse.json({ error: 'Failed to send confirmation' }, { status: 500 })
  }
}
