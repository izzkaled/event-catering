'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  getClarityProjectId,
  getGaMeasurementId,
  trackPageView,
} from '@/lib/analytics'

function GaPageViews({ measurementId }: { measurementId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!measurementId) return
    const qs = searchParams?.toString()
    const path = qs ? `${pathname}?${qs}` : pathname
    trackPageView(path)
  }, [measurementId, pathname, searchParams])

  return null
}

/** Google Analytics 4 + optional Microsoft Clarity. IDs from public env vars. */
export function SiteAnalytics() {
  const gaId = getGaMeasurementId()
  const clarityId = getClarityProjectId()

  if (!gaId && !clarityId) return null

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', { send_page_view: false, anonymize_ip: true });
            `}
          </Script>
          <GaPageViews measurementId={gaId} />
        </>
      ) : null}

      {clarityId ? (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      ) : null}
    </>
  )
}
