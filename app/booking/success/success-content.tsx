'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CalendarCheck } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'

export function BookingSuccessContent() {
  const params = useSearchParams()
  const orderNumber = params.get('order') || '---'
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <span className="mb-6 flex size-20 items-center justify-center rounded-full bg-accent/15 text-accent-foreground">
          <CalendarCheck className="size-10" />
        </span>
        <h1 className="text-2xl font-extrabold">{t('booking.success_title')}</h1>
        <p className="mt-2 text-muted-foreground">
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
          <Button render={<a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" />} nativeButton={false} variant="outline">
            {t('booking.whatsapp')}
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
