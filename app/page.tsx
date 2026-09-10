import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { ServicesSection } from '@/components/home/services-section'
import { PackagesPreview } from '@/components/home/packages-preview'
import { AreasSection } from '@/components/home/areas-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { FaqSection } from '@/components/home/faq-section'
import { CtaBanner } from '@/components/home/cta-banner'
import { HomeChatbot } from '@/components/home/home-chatbot'
import { JsonLdBusiness } from '@/components/seo/json-ld-business'
import { JsonLdFaq } from '@/components/seo/json-ld-faq'
import { getActivePackagesWithSections } from '@/lib/packages/queries'
import { SEO_DESCRIPTION, SEO_TITLE_DEFAULT, SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: SEO_TITLE_DEFAULT },
  description: SEO_DESCRIPTION,
  alternates: { canonical: SITE_URL },
}

async function getPackages() {
  return getActivePackagesWithSections()
}

export default async function HomePage() {
  const activePackages = await getPackages()

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <JsonLdBusiness />
      <JsonLdFaq />
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <Hero />
        <ServicesSection />
        <PackagesPreview packages={activePackages} />
        <HowItWorks />
        <AreasSection />
        <FaqSection limit={4} />
        <CtaBanner />
      </main>
      <SiteFooter />
      <HomeChatbot />
    </div>
  )
}
