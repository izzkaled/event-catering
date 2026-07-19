'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CalendarCheck, Download, Loader2, XCircle } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'

type StatusPayload = {
  orderNumber?: string
  paymentStatus?: string
  transactionId?: string | null
  amountOmr?: string
  error?: string
}

export function BookingSuccessContent() {
  const params = useSearchParams()
  const orderNumber =
    params.get('order') ||
    params.get('merchant_order_id') ||
    params.get('special_reference') ||
    '---'
  const successFlag = params.get('success')
  const { t, lang } = useLanguage()

  const [paid, setPaid] = useState(params.get('paid') === '1')
  const [failed, setFailed] = useState(successFlag === 'false')
  const [verifying, setVerifying] = useState(orderNumber !== '---')
  const [txnId, setTxnId] = useState<string | null>(params.get('id'))
  const [amount, setAmount] = useState<string | null>(null)

  useEffect(() => {
    if (orderNumber === '---') {
      setVerifying(false)
      return
    }

    let cancelled = false
    let attempts = 0

    const poll = async () => {
      try {
        const res = await fetch(`/api/payment/status/${encodeURIComponent(orderNumber)}`, {
          credentials: 'include',
        })
        const data = (await res.json().catch(() => null)) as StatusPayload | null
        if (cancelled || !data) return

        if (data.paymentStatus === 'paid') {
          setPaid(true)
          setFailed(false)
          setTxnId(data.transactionId || null)
          setAmount(data.amountOmr || null)
          setVerifying(false)
          return
        }

        if (data.paymentStatus === 'pending_verification') {
          window.location.replace(`/booking/pending?order=${encodeURIComponent(orderNumber)}`)
          return
        }

        if (data.paymentStatus === 'failed' || successFlag === 'false') {
          setFailed(true)
          setVerifying(false)
          return
        }

        attempts += 1
        if (attempts < 12) {
          setTimeout(poll, 1500)
        } else {
          // Webhook may still be in flight — only show paid when DB confirms it
          setVerifying(false)
        }
      } catch {
        if (!cancelled) {
          attempts += 1
          if (attempts < 5) setTimeout(poll, 1500)
          else setVerifying(false)
        }
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [orderNumber, successFlag])

  if (failed && !paid) {
    return (
      <div className="page-shell flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <span className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-100 text-red-700">
            <XCircle className="size-10" />
          </span>
          <h1 className="text-2xl font-extrabold">{t('payment.failed_title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('payment.failed_msg')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              render={
                <Link href={`/booking/payment?order=${encodeURIComponent(orderNumber)}`} />
              }
              nativeButton={false}
            >
              {t('payment.try_again')}
            </Button>
            <Button render={<Link href="/" />} nativeButton={false} variant="outline">
              {t('nav.home')}
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        {verifying ? (
          <Loader2 className="mb-6 size-16 animate-spin text-primary" />
        ) : (
          <span className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarCheck className="size-10" />
          </span>
        )}
        <h1 className="text-2xl font-extrabold">
          {paid ? t('booking.success_paid') : t('booking.success_title')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('booking.success_msg')}{' '}
          <span className="font-bold text-foreground">{orderNumber}</span>
        </p>
        {paid && txnId && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t('booking.success_txn')}{' '}
            <span className="font-semibold text-foreground">{txnId}</span>
          </p>
        )}
        {paid && amount && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t('booking.success_amount')}{' '}
            <span className="font-semibold text-foreground">
              {Number.parseFloat(amount).toFixed(2)} OMR
            </span>
          </p>
        )}
        {!verifying && !paid && (
          <p className="mt-3 max-w-md text-center text-sm text-amber-700">
            {lang === 'ar'
              ? 'جاري تأكيد الدفع — إذا استمرت المشكلة تواصل معنا على واتساب.'
              : 'Payment confirmation pending — contact us on WhatsApp if this persists.'}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button render={<Link href="/subscriptions" />} nativeButton={false}>
            {t('booking.track_order')}
          </Button>
          {orderNumber !== '---' && (
            <Button
              render={
                <a
                  href={`/api/invoice/${encodeURIComponent(orderNumber)}`}
                  download
                />
              }
              nativeButton={false}
              variant="outline"
            >
              <Download className="size-4" />
              {t('booking.download_invoice')}
            </Button>
          )}
          <Button render={<Link href="/" />} nativeButton={false} variant="outline">
            {t('nav.home')}
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
            {t('booking.whatsapp')}
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
