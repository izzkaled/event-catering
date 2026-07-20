import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { ServicesSection } from '@/components/home/services-section'
import { PackagesPreview } from '@/components/home/packages-preview'
import { AreasSection } from '@/components/home/areas-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { CtaBanner } from '@/components/home/cta-banner'
import { HomeChatbot } from '@/components/home/home-chatbot'
import { getActivePackagesWithSections } from '@/lib/packages/queries'

export const dynamic = 'force-dynamic'

async function getPackages() {
  try {
    return await getActivePackagesWithSections()
  } catch {
    return []
  }
}

export default async function HomePage() {
  const activePackages = await getPackages()

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <Hero />
        <ServicesSection />
        <PackagesPreview packages={activePackages} />
        <HowItWorks />
        <AreasSection />
        <CtaBanner />
      </main>
      <SiteFooter />
      <HomeChatbot />
    </div>
  )
}
