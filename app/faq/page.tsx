import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FaqPageContent } from '@/components/faq/faq-page-content'
import { JsonLdFaq } from '@/components/seo/json-ld-faq'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'
export const revalidate = 300

export const metadata: Metadata = {
  title: 'أسئلة شائعة كاترينج وضيافة عُمان | FAQ',
  description:
    'إجابات عن كاترينج المناسبات وباقات الضيافة والأسعار في عُمان. كيف تختار وتخصص وترسل طلبك عبر إيفنت كاترينج.',
  keywords: ['أسئلة كاترينج', 'أسعار ضيافة عمان', 'FAQ catering Oman'],
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: `أسئلة شائعة | ${SITE_NAME}`,
    description: 'أسئلة عن الكاترينج والضيافة والأسعار في عُمان.',
    url: `${SITE_URL}/faq`,
  },
}

export default function FaqPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <JsonLdFaq />
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <FaqPageContent />
      </main>
      <SiteFooter />
    </div>
  )
}
