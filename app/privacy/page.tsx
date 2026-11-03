import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PrivacyContent } from '@/components/legal/privacy-content'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | Privacy Policy',
  description:
    'كيف تجمع إيفنت كاترينج بياناتك الشخصية في عُمان وتستخدمها وتحميها وفق قانون حماية البيانات الشخصية.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: `سياسة الخصوصية | ${SITE_NAME}`,
    description: 'حماية البيانات الشخصية لطلبات الضيافة عبر إيفنت كاترينج.',
    url: `${SITE_URL}/privacy`,
  },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <PrivacyContent />
      </main>
      <SiteFooter />
    </div>
  )
}
