import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'

const sql = neon(process.env.DATABASE_URL)
const packageId = '500b1842-d033-4ed3-aa2d-b638e570f9d1'
const price = 85
const ceo = Math.round(price * 0.09 * 100) / 100
const developer = Math.round(price * 0.03 * 100) / 100
const commission = Math.round((ceo + developer) * 100) / 100
const net = Math.round((price - commission) * 100) / 100
const year = new Date().getFullYear()
const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM orders`
const orderNumber = `EVT-${year}-${String(Number(count) + 1).padStart(4, '0')}`

const [order] = await sql`
  INSERT INTO orders (
    order_number, customer_name, customer_phone, customer_email, customer_address, customer_area,
    notes, package_id, package_name_ar, package_name_en, hours_per_visit, visits_per_week, visits_per_month,
    price_omr, commission_omr, net_revenue_omr, start_date, end_date, preferred_time, preferred_days,
    status, payment_method, payment_status, payment_channel, payment_reference
  ) VALUES (
    ${orderNumber},
    ${'اختبار Resend'},
    ${'96877222432'},
    ${'izzkaled@gmail.com'},
    ${'مسقط — طلب تجريبي'},
    ${'Al Khuwair'},
    ${'طلب تجريبي للتحقق من الإيميل'},
    ${packageId}::uuid,
    ${'باقة استقبال رسمي'},
    ${'Official Reception'},
    ${3},
    ${25},
    ${1},
    ${price.toFixed(2)},
    ${commission.toFixed(2)},
    ${net.toFixed(2)},
    ${'2026-09-25'},
    ${'2026-09-25'},
    ${'10:00'},
    ${['Thursday']},
    ${'pending'},
    ${'bank_transfer'},
    ${'unpaid'},
    ${'bank_transfer'},
    ${orderNumber}
  )
  RETURNING id, order_number, price_omr, commission_omr, net_revenue_omr
`

await sql`
  INSERT INTO admin_notifications (order_id, message)
  VALUES (${order.id}::uuid, ${`طلب ضيافة جديد: ${order.order_number} — اختبار Resend`})
`

console.log('ORDER_CREATED', order)

const resend = new Resend(process.env.RESEND_API_KEY)
const from = process.env.RESEND_FROM_EMAIL || 'Event Catering <onboarding@resend.dev>'

const html = `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#2a1a2a">
  <h2 style="color:#4A234A">طلب ضيافة جديد — اختبار</h2>
  <p><strong>رقم الطلب:</strong> ${order.order_number}</p>
  <p><strong>الباقة:</strong> باقة استقبال رسمي</p>
  <p><strong>الضيوف:</strong> 25</p>
  <p><strong>التقدير:</strong> ${order.price_omr} OMR</p>
  <p><strong>عمولة CEO:</strong> ${ceo.toFixed(2)} · <strong>مطور:</strong> ${developer.toFixed(2)}</p>
  <p>هذا طلب تجريبي للتحقق من اتصال Resend.</p>
</div>`

const { data, error } = await resend.emails.send({
  from,
  to: 'izzkaled@gmail.com',
  subject: `طلب جديد ${order.order_number} — Event Catering`,
  html,
})

if (error) {
  console.error('EMAIL_FAILED', error)
  process.exit(1)
}
console.log('EMAIL_OK', data?.id)
