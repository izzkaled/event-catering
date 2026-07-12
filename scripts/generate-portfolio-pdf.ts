/**
 * Generate a portfolio PDF for Speedy Cleaning / Clean Plus.
 * Run: npx tsx scripts/generate-portfolio-pdf.ts
 * Output: Speedy-Cleaning-Portfolio.pdf (project root)
 */
import { jsPDF } from 'jspdf'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const OUT = resolve(process.cwd(), 'Speedy-Cleaning-Portfolio.pdf')

const C = {
  teal: [13, 148, 136] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  accent: [20, 184, 166] as [number, number, number],
}

function rgb(doc: jsPDF, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2])
}

function fill(doc: jsPDF, c: [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2])
}

function sectionTitle(doc: jsPDF, title: string, y: number) {
  fill(doc, C.teal)
  doc.rect(20, y, 3, 8, 'F')
  rgb(doc, C.dark)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(title, 28, y + 6)
  return y + 14
}

function bullet(doc: jsPDF, text: string, x: number, y: number, maxW = 160) {
  rgb(doc, C.teal)
  doc.setFontSize(9)
  doc.text('•', x, y)
  rgb(doc, C.dark)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const lines = doc.splitTextToSize(text, maxW)
  doc.text(lines, x + 5, y)
  return y + lines.length * 4.5 + 2
}

function footer(doc: jsPDF, page: number, total: number) {
  const h = doc.internal.pageSize.getHeight()
  rgb(doc, C.muted)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Speedy Cleaning · Clean Plus  |  Portfolio 2026', 20, h - 12)
  doc.text(`${page} / ${total}`, 190, h - 12, { align: 'right' })
}

function main() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const TOTAL = 3

  // ─── PAGE 1: Cover + Overview ─────────────────────────────────
  fill(doc, C.dark)
  doc.rect(0, 0, pageW, 95, 'F')
  fill(doc, C.teal)
  doc.rect(0, 95, pageW, 4, 'F')

  rgb(doc, C.accent)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('PRODUCT PORTFOLIO', 20, 28)

  rgb(doc, C.white)
  doc.setFontSize(28)
  doc.text('Speedy Cleaning', 20, 48)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'normal')
  doc.text('Clean Plus — Subscription Cleaning Platform', 20, 58)

  rgb(doc, [148, 163, 184])
  doc.setFontSize(10)
  doc.text('Muscat, Oman  ·  Full-stack web product  ·  2026', 20, 72)

  rgb(doc, C.white)
  doc.setFontSize(9)
  doc.text('Live: https://clean-plus1.netlify.app', 20, 85)

  let y = 115
  y = sectionTitle(doc, 'About the Project', y)
  rgb(doc, C.dark)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const about = doc.splitTextToSize(
    'Speedy Cleaning (Clean Plus) is a bilingual (Arabic / English) subscription platform for home cleaning services in Muscat. Customers browse packages, book recurring visits, pay online or by bank transfer, and manage their account. Admins run operations from a full dashboard: orders, schedule, customers, analytics, AI assistant, and invoice generation.',
    170,
  )
  doc.text(about, 20, y)
  y += about.length * 5 + 10

  y = sectionTitle(doc, 'Problem & Solution', y)
  y = bullet(
    doc,
    'Problem: Cleaning businesses rely on WhatsApp/phone for bookings — hard to track, schedule, and collect payments.',
    20,
    y,
  )
  y = bullet(
    doc,
    'Solution: End-to-end web app — public booking site + customer profiles + admin ops dashboard + Stripe payments + email/SMS OTP auth.',
    20,
    y,
  )
  y += 6

  y = sectionTitle(doc, 'Key Metrics / Scope', y)
  const metrics = [
    ['Market', 'Muscat home cleaning'],
    ['Languages', 'Arabic + English (RTL)'],
    ['Auth', 'Email OTP + Google + Phone SMS'],
    ['Payments', 'Stripe + bank transfer'],
    ['Hosting', 'Netlify + Neon Postgres'],
  ]
  for (const [k, v] of metrics) {
    fill(doc, C.light)
    doc.roundedRect(20, y - 3, 170, 9, 1.5, 1.5, 'F')
    rgb(doc, C.muted)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(k, 24, y + 2.5)
    rgb(doc, C.dark)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(v, 55, y + 2.5)
    y += 11
  }

  footer(doc, 1, TOTAL)

  // ─── PAGE 2: Features ─────────────────────────────────────────
  doc.addPage()
  y = 22
  y = sectionTitle(doc, 'Customer Features', y)
  const customer = [
    'Bilingual landing page with live packages from the database',
    'Multi-step booking flow: package → schedule → area → payment',
    'Subscription management and order history on the profile page',
    'Secure signup / login: email + password with OTP verification',
    'Google OAuth and Oman phone OTP (Twilio Verify)',
    'Stripe Checkout for cards; bank transfer fallback',
    'Email confirmations and PDF invoices',
  ]
  for (const line of customer) y = bullet(doc, line, 20, y)
  y += 6

  y = sectionTitle(doc, 'Admin Dashboard', y)
  const admin = [
    'Orders pipeline: pending → confirmed → active → completed / cancelled',
    'Package CRUD with featured flags and sort order',
    'Customer directory linked to Neon Auth users',
    'Schedule calendar (react-big-calendar) for visits and events',
    'Analytics charts (Recharts) and site visit tracking',
    'AI assistant (Gemini) for support / content help',
    'Content studio & WhatsApp message templates',
    'Team roles and settings',
  ]
  for (const line of admin) y = bullet(doc, line, 20, y)
  y += 6

  y = sectionTitle(doc, 'Security & Reliability', y)
  const security = [
    'Neon Auth (Better Auth) with email verification OTP',
    'Webhook signature verification (Ed25519) for Neon Auth & Stripe',
    'Rate limiting (Upstash Redis) on OTP and sensitive APIs',
    'Cloudflare Turnstile-ready bot protection hooks',
    'Internal API secrets for server-to-server email/PDF jobs',
  ]
  for (const line of security) y = bullet(doc, line, 20, y)

  footer(doc, 2, TOTAL)

  // ─── PAGE 3: Tech + Architecture ──────────────────────────────
  doc.addPage()
  y = 22
  y = sectionTitle(doc, 'Tech Stack', y)

  const stack: [string, string][] = [
    ['Frontend', 'Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui'],
    ['Backend', 'Next.js Route Handlers, Drizzle ORM, Neon Serverless Postgres'],
    ['Auth', 'Neon Auth (@neondatabase/auth), Google OAuth, Twilio Verify SMS'],
    ['Payments', 'Stripe Checkout + webhooks; OMR→USD conversion'],
    ['Email / SMS', 'Resend + Neon Auth email; Twilio Verify'],
    ['AI', 'Google Gemini for admin assistant'],
    ['Deploy', 'Netlify, Neon (us-east-2), env-based config'],
  ]
  for (const [k, v] of stack) {
    rgb(doc, C.teal)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(k, 20, y)
    rgb(doc, C.dark)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(v, 130)
    doc.text(lines, 50, y)
    y += Math.max(lines.length * 4.5, 6) + 3
  }
  y += 6

  y = sectionTitle(doc, 'Architecture (simplified)', y)
  fill(doc, C.light)
  doc.roundedRect(20, y, 170, 52, 2, 2, 'F')
  rgb(doc, C.dark)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  const arch = [
    'Browser (AR/EN UI)  →  Next.js on Netlify',
    '        ↓',
    'API routes  →  Drizzle  →  Neon Postgres (app tables + neon_auth)',
    '        ↓',
    'Neon Auth  ·  Stripe  ·  Resend / Twilio  ·  Gemini',
    '        ↓',
    'Webhooks: /api/webhooks/neon-auth  ·  /api/stripe/webhook',
  ]
  let ay = y + 8
  for (const line of arch) {
    doc.text(line, 28, ay)
    ay += 6
  }
  y = ay + 8

  y = sectionTitle(doc, 'Role & Delivery', y)
  const role = [
    'Designed and built as a production SaaS-style product for a local cleaning brand',
    'Owned full stack: UI, auth, booking, payments, admin ops, emails, and deploy',
    'Bilingual UX with RTL support for Arabic-first customers in Oman',
  ]
  for (const line of role) y = bullet(doc, line, 20, y)
  y += 10

  fill(doc, C.teal)
  doc.roundedRect(20, y, 170, 28, 2, 2, 'F')
  rgb(doc, C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Try the live product', 28, y + 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('https://clean-plus1.netlify.app', 28, y + 19)

  footer(doc, 3, TOTAL)

  const buf = Buffer.from(doc.output('arraybuffer'))
  writeFileSync(OUT, buf)
  console.log('✓ Portfolio PDF written to:', OUT)
}

main()
