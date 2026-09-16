/** Client/server analytics helpers — GA4 + optional Clarity. */

export function getGaMeasurementId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || ''
}

export function getGoogleSiteVerification() {
  return process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || ''
}

export function getClarityProjectId() {
  return process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || ''
}

export type AnalyticsEventParams = Record<string, string | number | boolean | undefined | null>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    clarity?: (...args: unknown[]) => void
  }
}

/** Fire a GA4 event (no-op if GA is not configured). */
export function trackEvent(eventName: string, params?: AnalyticsEventParams) {
  if (typeof window === 'undefined') return
  const cleaned: Record<string, string | number | boolean> = {}
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue
      cleaned[key] = value
    }
  }
  try {
    window.gtag?.('event', eventName, cleaned)
  } catch {
    // ignore
  }
}

export function trackPageView(path: string) {
  const id = getGaMeasurementId()
  if (!id || typeof window === 'undefined') return
  try {
    window.gtag?.('config', id, { page_path: path })
  } catch {
    // ignore
  }
}
