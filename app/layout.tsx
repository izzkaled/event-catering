import type { Metadata, Viewport } from 'next'
import { Cairo, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { LanguageProvider } from '@/components/language-provider'
import { VisitorTracker } from '@/components/visitor-tracker'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { SplashScreen } from '@/components/splash-screen'
import './globals.css'

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'خوصة | KHOUSA Oman — تنظيف منزلي في مسقط',
  description:
    'خوصة KHOUSA — خدمة تنظيف منزلي احترافية في مسقط، عُمان. باقات مرنة بالريال العُماني. احجز الآن!',
  keywords: ['cleaning Muscat', 'تنظيف منازل مسقط', 'خوصة', 'KHOUSA', 'Oman cleaning'],
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/logo-icon.png', type: 'image/png' }],
    apple: [{ url: '/logo-icon.png', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#223826',
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
      className={`${cairo.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased min-w-0">
        <LanguageProvider>
          <SplashScreen />
          {children}
          <VisitorTracker />
          <MobileBottomNav />
          <WhatsAppButton />
        </LanguageProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
