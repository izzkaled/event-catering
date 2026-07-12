import { Suspense } from 'react'
import { asc, eq } from 'drizzle-orm'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BookingFlow } from '@/components/booking/booking-flow'
import { db } from '@/lib/db'
import { packages } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

export default async function BookingPage() {
  const activePackages = await getPackages()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-24 sm:pb-0">
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
