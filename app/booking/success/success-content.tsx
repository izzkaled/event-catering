'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CalendarCheck, Loader2 } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'
const stripeEnabled = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim())

export function BookingSuccessContent() {
  const params = useSearchParams()
  const orderNumber = params.get('order') || '---'
  const sessionId = params.get('session_id')
  const { t, lang } = useLanguage()
  const [paid, setPaid] = useState(!stripeEnabled || !sessionId)
  const [verifying, setVerifying] = useState(Boolean(stripeEnabled && sessionId))

  useEffect(() => {
    if (!stripeEnabled || !sessionId) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`,
          { credentials: 'include' },
        )
        const data = (await res.json().catch(() => null)) as { paid?: boolean } | null
        if (!cancelled) {
          setPaid(Boolean(data?.paid))
        }
      } catch {
        if (!cancelled) setPaid(false)
      } finally {
        if (!cancelled) setVerifying(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        {verifying ? (
          <Loader2 className="mb-6 size-16 animate-spin text-primary" />
        ) : (
          <span className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarCheck className="size-10" />
          </span>
        )}
        <h1 className="text-2xl font-extrabold">
          {paid && stripeEnabled ? t('booking.success_paid') : t('booking.success_title')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('booking.success_msg')}{' '}
          <span className="font-bold text-foreground">{orderNumber}</span>
        </p>
        {stripeEnabled && sessionId && !verifying && !paid && (
          <p className="mt-3 max-w-md text-center text-sm text-amber-700">
            {lang === 'ar'
              ? 'جاري تأكيد الدفع — إذا استمرت المشكلة تواصل معنا على واتساب.'
              : 'Payment confirmation pending — contact us on WhatsApp if this persists.'}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button render={<Link href="/subscriptions" />} nativeButton={false}>
            {t('nav.subscriptions')}
          </Button>
          <Button render={<Link href="/" />} nativeButton={false} variant="outline">
            {t('nav.home')}
          </Button>
          <Button render={<a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" />} nativeButton={false} variant="outline">
            {t('booking.whatsapp')}
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
