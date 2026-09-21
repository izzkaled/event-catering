import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FaqSection } from '@/components/home/faq-section'
import { JsonLdFaq } from '@/components/seo/json-ld-faq'
import { Button } from '@/components/ui/button'
import { SITE_NAME, SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'أسئلة شائعة كاترينج وضيافة عُمان | FAQ',
  description:
    'إجابات عن كاترينج المناسبات، باقات الضيافة، الأسعار، الجهات الحكومية والشركات، والتخصيص والطلب أونلاين عبر إيفنت كاترينج في عُمان.',
  keywords: ['أسئلة كاترينج', 'أسعار ضيافة عمان', 'FAQ catering Oman'],
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: `أسئلة شائعة | ${SITE_NAME}`,
    description:
      'كاترينج، ضيافة، أسعار استرشادية، جهات حكومية وشركات — إيفنت كاترينج عُمان.',
    url: `${SITE_URL}/faq`,
  },
}

export default function FaqPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <JsonLdFaq />
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <div className="site-container border-b border-border py-10 text-center">
          <p className="text-sm font-semibold tracking-wide text-brand-sand">
            Event Catering · عُمان
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-palm sm:text-4xl">
            أسئلة شائعة عن باقات الضيافة
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            FAQ — packages, indicative pricing, government & corporate occasions, and how requests
            work with Event Catering.
          </p>
        </div>
        <FaqSection />
        <div className="site-container py-10 text-center">
          <Button
            render={<Link href="/packages" />}
            nativeButton={false}
            size="lg"
            className="h-12 bg-brand-palm px-10 font-bold text-brand-cream hover:bg-brand-palm/90"
          >
            تصفح الباقات · Browse packages
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
