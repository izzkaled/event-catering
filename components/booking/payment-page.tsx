'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2,
  Check,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type PaymentMethodChoice = 'paymob' | 'bank_transfer'

type OrderPaymentInfo = {
  id: string
  orderNumber: string
  paymentStatus: string
  paymentMethod: string
  amountOmr: string
  transactionId?: string | null
  packageNameAr?: string | null
  packageNameEn?: string | null
  hoursPerVisit?: number
  visitsPerWeek?: number
  startDate?: string
  preferredTime?: string
  customerName?: string
  customerArea?: string
}

type BankDetails = {
  bankName: string
  accountName: string
  accountNumber: string
  iban: string
  swift: string | null
}

const paymobPublicConfigured = Boolean(process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY?.trim())

function PaymentPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const { lang, t, dir } = useLanguage()
  const orderParam = params.get('order') || ''

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderPaymentInfo | null>(null)
  const [paymobEnabled, setPaymobEnabled] = useState(paymobPublicConfigured)
  const [method, setMethod] = useState<PaymentMethodChoice>('paymob')
  const [bank, setBank] = useState<BankDetails | null>(null)
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submitLock = useRef(false)

  const load = useCallback(async () => {
    if (!orderParam) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [statusRes, bankRes, configRes] = await Promise.all([
        fetch(`/api/payment/status/${encodeURIComponent(orderParam)}`, {
          credentials: 'include',
        }),
        fetch('/api/bank-transfer/upload'),
        fetch('/api/payment/config'),
      ])
      if (statusRes.status === 401) {
        router.push(`/auth/login?returnTo=${encodeURIComponent(`/booking/payment?order=${orderParam}`)}`)
        return
      }
      const data = (await statusRes.json().catch(() => null)) as OrderPaymentInfo | null
      if (!statusRes.ok || !data?.id) {
        throw new Error((data as { error?: string } | null)?.error || 'Order not found')
      }
      setOrder(data)

      if (data.paymentStatus === 'paid') {
        router.replace(`/booking/success?order=${data.orderNumber}&paid=1`)
        return
      }
      if (data.paymentStatus === 'pending_verification') {
        router.replace(`/booking/pending?order=${data.orderNumber}`)
        return
      }

      const bankData = (await bankRes.json().catch(() => null)) as { bank?: BankDetails } | null
      if (bankData?.bank) setBank(bankData.bank)

      const config = (await configRes.json().catch(() => null)) as {
        paymobEnabled?: boolean
      } | null
      const enabled = Boolean(config?.paymobEnabled || paymobPublicConfigured)
      setPaymobEnabled(enabled)
      setMethod(enabled ? 'paymob' : 'bank_transfer')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [orderParam, router])

  useEffect(() => {
    load()
  }, [load])

  const payWithPaymob = async () => {
    if (!order || submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = (await res.json().catch(() => null)) as {
        checkoutUrl?: string
        error?: string
      } | null
      if (!res.ok || !data?.checkoutUrl) {
        throw new Error(data?.error || (lang === 'ar' ? 'فشل فتح الدفع' : 'Checkout failed'))
      }
      window.location.href = data.checkoutUrl
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Payment failed')
      submitLock.current = false
      setSubmitting(false)
    }
  }

  const submitBankTransfer = async () => {
    if (!order || !file || submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('orderId', order.id)
      form.append('receipt', file)
      if (notes.trim()) form.append('notes', notes.trim())

      const res = await fetch('/api/bank-transfer/upload', {
        method: 'POST',
        credentials: 'include',
        body: form,
      })
      const data = (await res.json().catch(() => null)) as {
        orderNumber?: string
        error?: string
      } | null
      if (!res.ok) {
        throw new Error(data?.error || 'Upload failed')
      }
      router.push(`/booking/pending?order=${data?.orderNumber || order.orderNumber}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed')
      submitLock.current = false
      setSubmitting(false)
    }
  }

  const packageName =
    lang === 'ar'
      ? order?.packageNameAr || order?.packageNameEn
      : order?.packageNameEn || order?.packageNameAr

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!orderParam || !order) {
    return (
      <div className="site-container-tight py-20 text-center">
        <h1 className="text-xl font-bold">{t('payment.missing_order')}</h1>
        <Button className="mt-6" render={<Link href="/packages" />} nativeButton={false}>
          {t('nav.packages')}
        </Button>
      </div>
    )
  }

  return (
    <div className="site-container-wide py-8 sm:py-12" dir={dir}>
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary">{t('payment.secure_checkout')}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t('payment.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('booking.success_msg')}{' '}
          <span className="font-bold text-foreground">{order.orderNumber}</span>
        </p>
      </div>

      <div className="layout-with-sidebar-wide gap-6">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t('payment.methods')}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMethod('paymob')}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition-all',
                  method === 'paymob'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40',
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CreditCard className="size-5" />
                </span>
                <span className="font-bold">{t('payment.method_card')}</span>
                <span className="text-xs text-muted-foreground">
                  {t('payment.method_card_desc')}
                </span>
                {method === 'paymob' && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Check className="size-3.5" /> {t('payment.selected')}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank_transfer')}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition-all',
                  method === 'bank_transfer'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40',
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </span>
                <span className="font-bold">{t('payment.method_bank')}</span>
                <span className="text-xs text-muted-foreground">
                  {t('payment.method_bank_desc')}
                </span>
                {method === 'bank_transfer' && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Check className="size-3.5" /> {t('payment.selected')}
                  </span>
                )}
              </button>
            </div>
          </section>

          {method === 'paymob' && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <h2 className="mb-2 text-lg font-extrabold">{t('payment.card_title')}</h2>
              <p className="mb-5 text-sm text-muted-foreground">{t('payment.card_info')}</p>
              {!paymobEnabled && (
                <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
                  {lang === 'ar'
                    ? 'الدفع بالبطاقة غير مفعّل بعد. أضف مفاتيح Paymob في ملف .env.local ثم أعد تشغيل السيرفر.'
                    : 'Card payment is not configured yet. Add your Paymob keys to .env.local and restart the server.'}
                </p>
              )}
              <Button
                size="lg"
                className="h-12 w-full gap-2"
                disabled={submitting || !paymobEnabled}
                onClick={payWithPaymob}
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {t('payment.pay_now')}
              </Button>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Lock className="size-3.5" /> {t('payment.ssl')}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> {t('payment.powered_by')}
                </span>
              </div>
            </section>
          )}

          {method === 'bank_transfer' && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-lg font-extrabold">{t('payment.bank_title')}</h2>
              {bank && (
                <dl className="mb-5 space-y-2 rounded-xl bg-secondary/40 p-4 text-sm">
                  {[
                    [t('payment.bank_name'), bank.bankName],
                    [t('payment.account_name'), bank.accountName],
                    [t('payment.account_number'), bank.accountNumber],
                    [t('payment.iban'), bank.iban],
                    ...(bank.swift ? [[t('payment.swift'), bank.swift] as const] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-wrap justify-between gap-2">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-semibold tabular-nums">{value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt">{t('payment.upload_receipt')}</Label>
                  <label
                    htmlFor="receipt"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-8 text-center transition-colors hover:border-primary/40"
                  >
                    <Upload className="size-6 text-primary" />
                    <span className="text-sm font-medium">
                      {file
                        ? file.name
                        : lang === 'ar'
                          ? 'اختر صورة أو PDF (حد أقصى 2MB)'
                          : 'Choose image or PDF (max 2MB)'}
                    </span>
                    <input
                      id="receipt"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="sr-only"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('payment.transfer_notes')}</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder={lang === 'ar' ? 'ملاحظات اختيارية...' : 'Optional notes...'}
                  />
                </div>
                <Button
                  size="lg"
                  className="h-12 w-full gap-2"
                  disabled={submitting || !file}
                  onClick={submitBankTransfer}
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {t('payment.submit_transfer')}
                </Button>
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {t('payment.order_summary')}
          </h2>
          <div className="space-y-3 text-sm">
            {packageName && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t('payment.service')}</span>
                <span className="text-end font-medium">{packageName}</span>
              </div>
            )}
            {order.hoursPerVisit != null && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t('payment.duration')}</span>
                <span className="font-medium">
                  {order.hoursPerVisit}h · {order.visitsPerWeek}/
                  {lang === 'ar' ? 'أسبوع' : 'week'}
                </span>
              </div>
            )}
            {order.startDate && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t('booking.date')}</span>
                <span className="font-medium">{order.startDate}</span>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <div className="flex items-end justify-between">
                <span className="font-bold">{t('booking.total')}</span>
                <span className="text-2xl font-extrabold tabular-nums text-primary">
                  {Number.parseFloat(order.amountOmr).toFixed(2)}{' '}
                  <span className="text-sm font-semibold text-muted-foreground">OMR</span>
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function PaymentPageContent() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="min-w-0 flex-1 overflow-x-clip">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <Loader2 className="size-10 animate-spin text-primary" />
            </div>
          }
        >
          <PaymentPageInner />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
