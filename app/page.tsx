import { asc, eq } from 'drizzle-orm'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { ServicesSection } from '@/components/home/services-section'
import { PackagesPreview } from '@/components/home/packages-preview'
import { AreasSection } from '@/components/home/areas-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { CtaBanner } from '@/components/home/cta-banner'
import { db } from '@/lib/db'
import { packages } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

async function getPackages() {
  try {
    return await db
      .select()
      .from(packages)
      .where(eq(packages.is_active, true))
      .orderBy(asc(packages.sort_order))
  } catch {
    return []
  }
}

export default async function HomePage() {
  const activePackages = await getPackages()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <ServicesSection />
        <PackagesPreview packages={activePackages} />
        <HowItWorks />
        <AreasSection />
        <CtaBanner />
      </main>
      <SiteFooter />
    </div>
  )
}
