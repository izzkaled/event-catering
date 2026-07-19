'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Clock, Loader2 } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'

function PendingInner() {
  const params = useSearchParams()
  const orderNumber = params.get('order') || '---'
  const { t, lang } = useLanguage()

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-6 flex size-20 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200">
        <Clock className="size-10" />
      </span>
      <h1 className="text-2xl font-extrabold">{t('payment.pending_title')}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t('payment.pending_msg')}</p>
      <p className="mt-4 text-sm">
        {t('booking.success_msg')}{' '}
        <span className="font-bold text-foreground">{orderNumber}</span>
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button render={<Link href="/subscriptions" />} nativeButton={false}>
          {t('nav.subscriptions')}
        </Button>
        <Button render={<Link href="/" />} nativeButton={false} variant="outline">
          {t('nav.home')}
        </Button>
      </div>
      <p className="mt-6 max-w-sm text-xs text-muted-foreground">
        {lang === 'ar'
          ? 'سيتم إشعارك عند التحقق من التحويل.'
          : 'We will notify you once the transfer is verified.'}
      </p>
    </main>
  )
}

export default function BookingPendingPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-10 animate-spin text-primary" />
          </div>
        }
      >
        <PendingInner />
      </Suspense>
      <SiteFooter />
    </div>
  )
}
