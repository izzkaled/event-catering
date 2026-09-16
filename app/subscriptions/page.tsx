'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock, Download, MapPin, Package, Sparkles } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/constants'
import { formatGuests, formatServiceHours } from '@/lib/packages/semantics'
import type { Order } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

export default function MySubscriptionsPage() {
  const router = useRouter()
  const { dir, lang } = useLanguage()
  const [loading, setLoading] = React.useState(true)
  const [subscriptions, setSubscriptions] = React.useState<Order[]>([])

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  React.useEffect(() => {
    fetch('/api/subscriptions', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace('/auth/login?redirect=/subscriptions')
          return null
        }
        if (!res.ok) return null
        return res.json() as Promise<{ subscriptions: Order[] }>
      })
      .then((data) => {
        if (data?.subscriptions) setSubscriptions(data.subscriptions)
      })
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex min-w-0 flex-1 items-center justify-center overflow-x-clip p-8 text-muted-foreground">
          {t('جاري التحميل...', 'Loading...')}
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main dir={dir} className="site-container-narrow min-w-0 flex-1 overflow-x-clip py-6 pb-24 sm:py-10 sm:pb-10">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t('طلباتي', 'My requests')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                'تابع حالة طلب الضيافة والدفع من هنا',
                'Track your hospitality request and payment status here',
              )}
            </p>
          </div>
          <Button render={<Link href="/packages" />} nativeButton={false} className="h-11 w-full sm:w-auto">
            {t('طلب جديد', 'New request')}
          </Button>
        </div>

        {subscriptions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                {t('لا توجد طلبات بعد', 'No requests yet')}
              </CardTitle>
              <CardDescription>
                {t(
                  'اختر باقة مناسبة وستظهر طلباتك هنا مع حالة المراجعة والدفع.',
                  'Choose a package and your requests will appear here with review and payment status.',
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href="/packages" />} nativeButton={false}>
                {t('تصفح الباقات', 'Browse packages')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const statusKey = sub.status || 'pending'
              const payKey = sub.payment_status || 'unpaid'
              const statusLabel = ORDER_STATUS_LABELS[statusKey]
              const payLabel = PAYMENT_STATUS_LABELS[payKey]
              const statusText = lang === 'ar' ? statusLabel?.ar : statusLabel?.en
              const payText = lang === 'ar' ? payLabel?.ar : payLabel?.en
              const packageName =
                lang === 'ar'
                  ? sub.package_name_ar || `${formatServiceHours(sub.hours_per_visit, 'ar')}`
                  : sub.package_name_en || `${formatServiceHours(sub.hours_per_visit, 'en')}`

              return (
                <Card key={sub.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{packageName}</CardTitle>
                      <CardDescription className="font-mono text-xs">{sub.order_number}</CardDescription>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                          ORDER_STATUS_COLORS[statusKey] || ORDER_STATUS_COLORS.pending,
                        )}
                      >
                        {statusText || statusKey}
                      </span>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                          PAYMENT_STATUS_COLORS[payKey] || PAYMENT_STATUS_COLORS.unpaid,
                        )}
                      >
                        {payText || payKey}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Package className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{t('تفاصيل الباقة', 'Package details')}</div>
                        <div>
                          {t(
                            `${formatGuests(sub.visits_per_week, 'ar')} · ${formatServiceHours(sub.hours_per_visit, 'ar')}`,
                            `${formatGuests(sub.visits_per_week, 'en')} · ${formatServiceHours(sub.hours_per_visit, 'en')}`,
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{t('تاريخ الفعالية', 'Event date')}</div>
                        <div dir="ltr" className="text-start">
                          {sub.start_date}
                          {sub.end_date && sub.end_date !== sub.start_date ? ` → ${sub.end_date}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{t('الوقت المفضل', 'Preferred time')}</div>
                        <div>{sub.preferred_time}</div>
                        {(sub.preferred_days || []).length > 0 ? (
                          <div className="text-xs">{(sub.preferred_days || []).join(' · ')}</div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{t('الموقع', 'Location')}</div>
                        <div>{sub.customer_area}</div>
                        {sub.customer_address ? (
                          <div className="text-xs leading-relaxed">{sub.customer_address}</div>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-3 sm:col-span-2">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground">{t('السعر الاسترشادي', 'Indicative price')}</div>
                          <div className="text-lg font-bold text-foreground">{sub.price_omr} OMR</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          render={
                            <a
                              href={`/api/invoice/${encodeURIComponent(sub.order_number)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                          nativeButton={false}
                        >
                          <Download className="size-3.5" />
                          {t('فاتورة PDF', 'PDF invoice')}
                        </Button>
                      </div>
                      {statusKey === 'pending' && payKey === 'unpaid' ? (
                        <p className="mt-2 text-xs text-amber-800">
                          {t(
                            'طلبك قيد المراجعة — سنتواصل معك لتأكيد العرض والدفع.',
                            'Your request is under review — we will contact you to confirm the quote and payment.',
                          )}
                        </p>
                      ) : null}
                      {payKey === 'pending_verification' ? (
                        <p className="mt-2 text-xs text-amber-800">
                          {t(
                            'استلمنا إيصال التحويل وهو بانتظار التحقق.',
                            'We received your transfer receipt and it is pending verification.',
                          )}
                        </p>
                      ) : null}
                      {payKey === 'paid' ? (
                        <p className="mt-2 text-xs text-emerald-800">
                          {t('تم تأكيد الدفع بنجاح.', 'Payment confirmed successfully.')}
                        </p>
                      ) : null}
                      {payKey === 'failed' ? (
                        <p className="mt-2 text-xs text-rose-800">
                          {t(
                            'فشل الدفع أو رُفض الإيصال — يرجى التواصل معنا لإعادة المحاولة.',
                            'Payment failed or receipt rejected — please contact us to try again.',
                          )}
                        </p>
                      ) : null}
                      {statusKey === 'cancelled' ? (
                        <p className="mt-2 text-xs text-rose-800">
                          {t('تم إلغاء هذا الطلب.', 'This request was cancelled.')}
                        </p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
