'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CinematicWaiting } from '@/components/cinematic-waiting'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'

function PendingInner() {
  const params = useSearchParams()
  const orderNumber = params.get('order') || '---'
  const { t, lang } = useLanguage()

  return (
    <CinematicWaiting
      variant="full"
      title={t('payment.pending_title')}
      subtitle={t('payment.pending_msg')}
      className="min-h-[calc(100dvh-8rem)]"
    >
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5">
        <p className="rounded-full border border-brand-sand/35 bg-white/70 px-4 py-2 text-sm text-brand-palm">
          {t('booking.success_msg')}{' '}
          <span className="font-bold tracking-wide" dir="ltr">
            {orderNumber}
          </span>
        </p>

        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button
            render={<Link href="/subscriptions" />}
            nativeButton={false}
            className="h-11 bg-brand-palm text-brand-cream hover:bg-brand-palm/90"
          >
            {t('nav.subscriptions')}
          </Button>
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="outline"
            className="h-11 border-brand-sand/40"
          >
            {t('nav.home')}
          </Button>
        </div>

        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          {lang === 'ar'
            ? 'سنُعلمك فور التحقق من التحويل.'
            : 'We’ll notify you once the transfer is verified.'}
        </p>
      </div>
    </CinematicWaiting>
  )
}

export default function BookingPendingPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col bg-brand-cream">
      <SiteHeader />
      <Suspense fallback={<CinematicWaiting title="لحظة…" subtitle="نتحقق من طلبك" />}>
        <PendingInner />
      </Suspense>
      <SiteFooter />
    </div>
  )
}
