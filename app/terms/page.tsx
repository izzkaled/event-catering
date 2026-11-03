import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { TermsContent } from '@/components/legal/terms-content'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'الشروط والأحكام | Terms of Service',
  description:
    'شروط استخدام منصة إيفنت كاترينج لطلبات الضيافة والكاترينج في عُمان: الحسابات، الطلبات، الدفع، والمسؤولية.',
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: `الشروط والأحكام | ${SITE_NAME}`,
    description: 'الشروط القانونية لاستخدام إيفنت كاترينج وطلبات الضيافة.',
    url: `${SITE_URL}/terms`,
  },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <TermsContent />
      </main>
      <SiteFooter />
    </div>
  )
}
