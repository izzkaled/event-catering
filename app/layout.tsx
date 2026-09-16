import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { LanguageProvider } from '@/components/language-provider'
import { VisitorTracker } from '@/components/visitor-tracker'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { SplashScreen } from '@/components/splash-screen'
import { SiteAnalyticsProvider } from '@/components/analytics/site-analytics-provider'
import { getGoogleSiteVerification } from '@/lib/analytics'
import {
  OG_IMAGE,
  SEO_DESCRIPTION,
  SEO_DESCRIPTION_AR,
  SEO_DESCRIPTION_EN,
  SEO_KEYWORDS,
  SEO_TITLE_DEFAULT,
  SEO_TITLE_EN,
  SITE_NAME,
  SITE_URL,
} from '@/lib/seo'
import './globals.css'

/** Clean bilingual face — SF-like weights, excellent Arabic. */
const plex = IBM_Plex_Sans_Arabic({
  variable: '--font-plex',
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const googleVerification = getGoogleSiteVerification()

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO_TITLE_DEFAULT,
    template: `%s | ${SITE_NAME}`,
  },
  description: SEO_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'hospitality catering',
  classification: 'Event Catering — Hospitality Packages Oman',
  alternates: {
    canonical: '/',
    languages: {
      'ar-OM': '/',
      'en-OM': '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_OM',
    alternateLocale: ['en_OM'],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SEO_TITLE_DEFAULT,
    description: `${SEO_DESCRIPTION_AR} — ${SEO_DESCRIPTION_EN}`,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Event Catering | إيفنت كاترينج — ضيافة بالباقات',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE_EN,
    description: SEO_DESCRIPTION_EN,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/images/brand/logo-mark.webp', type: 'image/webp' },
    ],
    apple: [{ url: '/images/brand/logo-mark.webp', type: 'image/webp' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#4a234a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plex.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-ios antialiased min-w-0">
        <LanguageProvider>
          <SplashScreen />
          {children}
          <VisitorTracker />
          <SiteAnalyticsProvider />
          <MobileBottomNav />
        </LanguageProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
