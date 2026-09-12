import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { IntroSection } from '@/components/home/intro-section'
import { OccasionsSection } from '@/components/home/occasions-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { CustomExperience } from '@/components/home/custom-experience'
import { AudienceSections } from '@/components/home/audience-sections'
import { ValueTrustSections } from '@/components/home/value-trust-sections'
import { FaqSection } from '@/components/home/faq-section'
import { CtaBanner } from '@/components/home/cta-banner'
import { HomeChatbot } from '@/components/home/home-chatbot'
import { JsonLdBusiness } from '@/components/seo/json-ld-business'
import { JsonLdFaq } from '@/components/seo/json-ld-faq'
import { SEO_DESCRIPTION, SEO_TITLE_DEFAULT, SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: SEO_TITLE_DEFAULT },
  description: SEO_DESCRIPTION,
  alternates: { canonical: SITE_URL },
}

export default function HomePage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <JsonLdBusiness />
      <JsonLdFaq />
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <Hero />
        <IntroSection />
        <OccasionsSection />
        <HowItWorks />
        <div className="bg-[#f3eee6]">
          <CustomExperience />
          <AudienceSections />
          <ValueTrustSections />
        </div>
        <FaqSection limit={4} />
        <CtaBanner />
      </main>
      <SiteFooter />
      <HomeChatbot />
    </div>
  )
}
