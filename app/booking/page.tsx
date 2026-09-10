import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BookingFlow } from '@/components/booking/booking-flow'
import { getActivePackagesWithSections } from '@/lib/packages/queries'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPackages() {
  return getActivePackagesWithSections()
}

export default async function BookingPage() {
  const activePackages = await getPackages()

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip pb-24 sm:pb-0">
        <Suspense>
          <BookingFlow packages={activePackages} />
        </Suspense>
      </main>
      <div className="hidden sm:block">
        <SiteFooter />
      </div>
    </div>
  )
}
