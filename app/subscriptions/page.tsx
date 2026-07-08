'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock, Package, Sparkles } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/constants'
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
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
          {t('جاري التحميل...', 'Loading...')}
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main dir={dir} className="mx-auto w-full max-w-3xl flex-1 px-3 py-6 pb-24 sm:px-4 sm:py-10 sm:pb-10">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t('اشتراكاتي', 'My subscriptions')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                'طلبات الباقات والحالة بعد تأكيد الإدارة',
                'Your package requests and status after admin confirmation',
              )}
            </p>
          </div>
          <Button render={<Link href="/booking" />} nativeButton={false} className="h-11 w-full sm:w-auto">
            {t('طلب اشتراك جديد', 'New subscription')}
          </Button>
        </div>

        {subscriptions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                {t('لا توجد اشتراكات بعد', 'No subscriptions yet')}
              </CardTitle>
              <CardDescription>
                {t(
                  'احجز باقة تنظيف وستظهر هنا تلقائياً بانتظار تأكيد الإدارة.',
                  'Book a cleaning package and it will appear here pending admin confirmation.',
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href="/booking" />} nativeButton={false}>
                {t('احجز الآن', 'Book now')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const statusKey = sub.status || 'pending'
              const label = ORDER_STATUS_LABELS[statusKey]
              const statusText = lang === 'ar' ? label?.ar : label?.en
              const packageName =
                lang === 'ar'
                  ? sub.package_name_ar || `${sub.hours_per_visit}س / ${sub.visits_per_week}ز`
                  : sub.package_name_en || `${sub.hours_per_visit}h / ${sub.visits_per_week}v`

              return (
                <Card key={sub.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{packageName}</CardTitle>
                      <CardDescription className="font-mono text-xs">{sub.order_number}</CardDescription>
                    </div>
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                        ORDER_STATUS_COLORS[statusKey] || ORDER_STATUS_COLORS.pending,
                      )}
                    >
                      {statusText || statusKey}
                    </span>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Package className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{t('نوع الاشتراك', 'Subscription type')}</div>
                        <div>
                          {t(
                            `${sub.hours_per_visit} ساعات · ${sub.visits_per_week} زيارات/أسبوع · ${sub.visits_per_month} شهرياً`,
                            `${sub.hours_per_visit} hours · ${sub.visits_per_week} visits/week · ${sub.visits_per_month}/month`,
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{t('مدة الاشتراك', 'Duration')}</div>
                        <div dir="ltr" className="text-start">
                          {sub.start_date}
                          {sub.end_date ? ` → ${sub.end_date}` : ''}
                        </div>
                        <div className="text-xs">{t('شهر واحد (قابل للتجديد)', 'One month (renewable)')}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{t('الوقت المفضل', 'Preferred time')}</div>
                        <div>{sub.preferred_time}</div>
                        <div className="text-xs">{(sub.preferred_days || []).join(' · ')}</div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-3">
                      <div className="text-xs text-muted-foreground">{t('السعر الشهري', 'Monthly price')}</div>
                      <div className="text-lg font-bold text-foreground">{sub.price_omr} OMR</div>
                      {statusKey === 'pending' && (
                        <Badge variant="outline" className="mt-2 border-amber-300 text-amber-800">
                          {t('بانتظار تأكيد الإدارة', 'Awaiting admin confirmation')}
                        </Badge>
                      )}
                      {(statusKey === 'confirmed' || statusKey === 'active') && (
                        <Badge variant="outline" className="mt-2 border-emerald-300 text-emerald-800">
                          {t('تم تأكيد حجز الاشتراك', 'Subscription booking confirmed')}
                        </Badge>
                      )}
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
