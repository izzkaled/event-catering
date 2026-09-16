import { Suspense } from 'react'
import { SiteAnalytics } from '@/components/analytics/site-analytics'

/** Suspense boundary required because SiteAnalytics uses useSearchParams. */
export function SiteAnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <SiteAnalytics />
    </Suspense>
  )
}
