'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'

function FailedInner() {
  const params = useSearchParams()
  const orderNumber = params.get('order') || ''
  const reason = params.get('reason') || ''
  const { t, lang } = useLanguage()
  const paymentHref = orderNumber
    ? `/booking/payment?order=${encodeURIComponent(orderNumber)}`
    : '/packages'

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200">
        <AlertCircle className="size-10" />
      </span>
      <h1 className="text-2xl font-extrabold">{t('payment.failed_title')}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        {reason || t('payment.failed_msg')}
      </p>
      {orderNumber && (
        <p className="mt-3 text-sm">
          {t('booking.success_msg')}{' '}
          <span className="font-bold">{orderNumber}</span>
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button render={<Link href={paymentHref} />} nativeButton={false}>
          {t('payment.try_again')}
        </Button>
        <Button render={<Link href={paymentHref} />} nativeButton={false} variant="outline">
          {t('payment.choose_another')}
        </Button>
        <Button
          render={
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          nativeButton={false}
          variant="outline"
        >
          {lang === 'ar' ? 'تواصل معنا' : 'Contact support'}
        </Button>
      </div>
    </main>
  )
}

export default function BookingFailedPage() {
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
        <FailedInner />
      </Suspense>
      <SiteFooter />
    </div>
  )
}
