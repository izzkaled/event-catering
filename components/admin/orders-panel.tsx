'use client'

import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  Apple,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  ConciergeBell,
  Copy,
  CreditCard,
  Download,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Search,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Order } from '@/lib/db/schema'
import {
  MUSCAT_AREAS,
  ORDER_STATUS_LABELS,
  calcCommissionBreakdown,
  formatPhoneDisplay,
} from '@/lib/constants'
import {
  channelFromPaymentMethod,
  paymentChannelBadgeClass,
  paymentChannelLabel,
} from '@/lib/paymob/payment-channel'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'

const STATUSES = ['pending', 'confirmed', 'active', 'cancelled', 'completed'] as const
type OrderStatus = (typeof STATUSES)[number]

const STATUS_META: Record<
  OrderStatus,
  { icon: ComponentType<{ className?: string }>; badge: string; chip: string }
> = {
  pending: {
    icon: Clock,
    badge: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80',
    chip: 'data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500',
  },
  confirmed: {
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80',
    chip: 'data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:border-emerald-600',
  },
  active: {
    icon: ConciergeBell,
    badge: 'bg-sky-100 text-sky-900 ring-1 ring-sky-200/80',
    chip: 'data-[active=true]:bg-sky-600 data-[active=true]:text-white data-[active=true]:border-sky-600',
  },
  cancelled: {
    icon: XCircle,
    badge: 'bg-rose-100 text-rose-900 ring-1 ring-rose-200/80',
    chip: 'data-[active=true]:bg-rose-600 data-[active=true]:text-white data-[active=true]:border-rose-600',
  },
  completed: {
    icon: BadgeCheck,
    badge: 'bg-brand-palm/12 text-brand-palm ring-1 ring-brand-palm/20',
    chip: 'data-[active=true]:bg-brand-palm data-[active=true]:text-brand-cream data-[active=true]:border-brand-palm',
  },
}

const selectClass =
  'h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function packageLabel(order: Order, lang: 'ar' | 'en', tx: (ar: string, en: string) => string) {
  if (lang === 'ar') return order.package_name_ar || tx('باقة ضيافة', 'Hospitality package')
  return order.package_name_en || order.package_name_ar || 'Package'
}

function StatusBadge({ status, lang }: { status: string; lang: 'ar' | 'en' }) {
  const meta = STATUS_META[status as OrderStatus] || STATUS_META.pending
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', meta.badge)}>
      <Icon className="size-3.5" />
      {ORDER_STATUS_LABELS[status]?.[lang] || status}
    </span>
  )
}

export function OrdersPanel() {
  const { tx, lang } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [notifyingId, setNotifyingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/admin/orders')
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 60000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
        toast.success(
          status === 'confirmed' || status === 'active'
            ? tx('تم تأكيد العرض / الطلب', 'Quote / order confirmed')
            : status === 'cancelled'
              ? tx('تم إلغاء الطلب — تم إعلام العميل', 'Order cancelled — customer notified')
              : tx('تم تحديث الحالة', 'Status updated'),
        )
      } else {
        toast.error(tx('فشل تحديث الحالة', 'Failed to update status'))
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const resendNotification = async (id: string) => {
    setNotifyingId(id)
    try {
      const res = await fetch(`/api/admin/orders/${id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string; skipped?: boolean }
        | null
      if (res.ok && data?.success !== false) {
        toast.success(
          data?.skipped
            ? tx('تم التخطي — تحقق من RESEND_API_KEY على Netlify', 'Skipped — check RESEND_API_KEY on Netlify')
            : tx('تم إعادة إرسال الإشعار', 'Notification resent'),
        )
      } else {
        toast.error(data?.error || tx('فشل إرسال الإشعار', 'Failed to send notification'))
      }
    } catch {
      toast.error(tx('فشل إرسال الإشعار', 'Failed to send notification'))
    } finally {
      setNotifyingId(null)
    }
  }

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false
      if (areaFilter && o.customer_area !== areaFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !o.customer_name.toLowerCase().includes(q) &&
          !o.order_number.toLowerCase().includes(q) &&
          !o.customer_phone.includes(q)
        )
          return false
      }
      return true
    })
  }, [orders, statusFilter, areaFilter, search])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of STATUSES) counts[s] = 0
    for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1
    return counts
  }, [orders])

  const totals = filtered.reduce(
    (acc, o) => {
      if (o.status === 'cancelled') return acc
      return {
        price: acc.price + parseFloat(o.price_omr),
        commission: acc.commission + parseFloat(o.commission_omr),
        net: acc.net + parseFloat(o.net_revenue_omr),
      }
    },
    { price: 0, commission: 0, net: 0 },
  )

  const exportCsv = () => {
    const headers =
      lang === 'ar'
        ? ['رقم الطلب', 'الاسم', 'الجوال', 'المنطقة', 'الباقة', 'السعر', 'العمولة', 'الصافي', 'طريقة الدفع', 'آخر 4', 'الحالة', 'التاريخ']
        : ['Order', 'Name', 'Phone', 'Area', 'Package', 'Price', 'Commission', 'Net', 'Payment', 'Last4', 'Status', 'Date']
    const rows = filtered.map((o) => {
      const channel = o.payment_channel || channelFromPaymentMethod(o.payment_method)
      return [
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.customer_area,
        packageLabel(o, lang, tx),
        o.price_omr,
        o.commission_omr,
        o.net_revenue_omr,
        paymentChannelLabel(channel, lang),
        o.payment_card_last4 || '',
        o.status,
        o.created_at,
      ]
    })
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orders.csv'
    a.click()
  }

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone)
    toast.success(tx('تم النسخ', 'Copied'))
  }

  const renderActions = (order: Order) => (
    <div className="flex flex-wrap gap-2">
      {order.status === 'pending' ? (
        <Button
          size="sm"
          disabled={updatingId === order.id}
          onClick={() => updateStatus(order.id, 'confirmed')}
          className="gap-1 bg-emerald-700 text-white hover:bg-emerald-800"
        >
          <CheckCircle2 className="size-3.5" />
          {tx('تأكيد العرض', 'Confirm quote')}
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        render={
          <a
            href={`/api/invoice/${encodeURIComponent(order.order_number)}`}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
        nativeButton={false}
        className="gap-1 border-brand-sand/50 text-brand-palm hover:bg-brand-sand/15"
      >
        <FileText className="size-3.5" />
        {tx('فاتورة PDF', 'Invoice PDF')}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={notifyingId === order.id}
        onClick={() => resendNotification(order.id)}
        className="gap-1 border-sky-200 text-sky-800 hover:bg-sky-50"
      >
        <Mail className="size-3.5" />
        {notifyingId === order.id ? tx('جاري الإرسال...', 'Sending...') : tx('إعادة إرسال', 'Resend')}
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    )
  }

  const summary = [
    {
      label: tx('كل الطلبات', 'All orders'),
      value: String(orders.length),
      hint: tx('في النظام', 'in the system'),
      icon: ClipboardList,
      wrap: 'bg-brand-palm/8',
      iconWrap: 'bg-brand-palm text-brand-cream',
    },
    {
      label: tx('بانتظار المراجعة', 'Pending review'),
      value: String(statusCounts.pending || 0),
      hint: tx('تحتاج إجراء', 'need action'),
      icon: Clock,
      wrap: 'bg-amber-50',
      iconWrap: 'bg-amber-500 text-white',
    },
    {
      label: tx('إجمالي الظاهر', 'Visible total'),
      value: `${totals.price.toFixed(2)} OMR`,
      hint: tx('بدون الملغى', 'excluding cancelled'),
      icon: Wallet,
      wrap: 'bg-brand-sand/20',
      iconWrap: 'bg-brand-sand text-brand-palm',
    },
    {
      label: tx('الصافي', 'Net'),
      value: `${totals.net.toFixed(2)} OMR`,
      hint: tx(`عمولة ${totals.commission.toFixed(2)} ر.ع`, `commission ${totals.commission.toFixed(2)} OMR`),
      icon: TrendingUp,
      wrap: 'bg-[#b8915a]/12',
      iconWrap: 'bg-[#b8915a] text-white',
    },
  ]

  return (
    <div className="@container flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 @4xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className={cn('border-0 shadow-none ring-1 ring-foreground/8', item.wrap)}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="ltr-data mt-1 truncate text-xl font-extrabold tracking-tight">{item.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{item.hint}</p>
                </div>
                <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl', item.iconWrap)}>
                  <Icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] scrollbar-none">
        <button
          type="button"
          data-active={!statusFilter}
          onClick={() => setStatusFilter('')}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition data-[active=true]:border-brand-palm data-[active=true]:bg-brand-palm data-[active=true]:text-brand-cream"
        >
          <Users className="size-3.5" />
          {tx('الكل', 'All')}
          <span className="ltr-data opacity-80">{orders.length}</span>
        </button>
        {STATUSES.map((s) => {
          const Icon = STATUS_META[s].icon
          return (
            <button
              key={s}
              type="button"
              data-active={statusFilter === s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition',
                STATUS_META[s].chip,
              )}
            >
              <Icon className="size-3.5" />
              {ORDER_STATUS_LABELS[s][lang]}
              <span className="ltr-data opacity-80">{statusCounts[s] || 0}</span>
            </button>
          )
        })}
      </div>

      <Card className="border-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 @3xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={tx('بحث بالاسم أو الرقم أو الجوال...', 'Search name, order, or phone...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">{tx('كل الحالات', 'All statuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]?.[lang]}
              </option>
            ))}
          </select>
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className={selectClass}>
            <option value="">{tx('كل المناطق', 'All areas')}</option>
            {MUSCAT_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={exportCsv} className="w-full gap-1.5 border-brand-sand/40 sm:col-span-2 @3xl:col-span-1 @3xl:w-auto">
            <Download className="size-4" />
            {tx('تصدير CSV', 'Export CSV')}
          </Button>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <ClipboardList className="size-8 text-brand-sand" />
            <p className="font-medium text-foreground">{tx('لا توجد طلبات مطابقة', 'No matching orders')}</p>
            <p>{tx('غيّر البحث أو الفلاتر لعرض النتائج.', 'Change search or filters to see results.')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 @3xl:grid-cols-2">
            {filtered.map((order) => (
              <Card key={order.id} className="border-0 shadow-none ring-1 ring-foreground/8">
                <CardContent className="flex flex-col gap-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="ltr-data font-mono text-xs text-brand-sand">{order.order_number}</p>
                      <p className="mt-1 font-bold">{order.customer_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={order.status} lang={lang} />
                      {(() => {
                        const channel =
                          order.payment_channel || channelFromPaymentMethod(order.payment_method)
                        if (channel === 'unknown' && order.payment_status === 'unpaid') return null
                        return (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              paymentChannelBadgeClass(channel),
                            )}
                          >
                            {channel === 'apple_pay' ? <Apple className="size-3" /> : null}
                            {channel === 'bank_transfer' ? <Banknote className="size-3" /> : null}
                            {(channel === 'visa' ||
                              channel === 'mastercard' ||
                              channel === 'card' ||
                              channel === 'paymob') && <CreditCard className="size-3" />}
                            {paymentChannelLabel(channel, lang)}
                            {order.payment_card_last4 ? (
                              <span className="ltr-data opacity-80">•••• {order.payment_card_last4}</span>
                            ) : null}
                          </span>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brand-terracotta" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">{tx('الموقع', 'Venue')}</p>
                        <p>{order.customer_area}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-sky-700" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">{tx('تاريخ المناسبة', 'Event date')}</p>
                        <p className="ltr-data">{order.start_date}</p>
                        {order.preferred_time ? (
                          <p className="ltr-data text-xs text-muted-foreground">{order.preferred_time}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-start gap-2">
                      <Package className="mt-0.5 size-4 shrink-0 text-brand-palm" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">{tx('الباقة', 'Package')}</p>
                        <p className={lang === 'ar' ? 'font-ar' : 'font-en'}>{packageLabel(order, lang, tx)}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="ltr-data">{order.visits_per_week}</span> {tx('شخص', 'guests')} ·{' '}
                          <span className="ltr-data">{order.hours_per_visit}</span> {tx('ساعة', 'hours')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2">
                    <div>
                      <p className="ltr-data text-xs text-muted-foreground">{formatPhoneDisplay(order.customer_phone)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="flex size-9 items-center justify-center rounded-lg hover:bg-background"
                        onClick={() => copyPhone(order.customer_phone)}
                        aria-label={tx('نسخ', 'Copy')}
                      >
                        <Copy className="size-4" />
                      </button>
                      <a
                        href={`https://wa.me/${order.customer_phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex size-9 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50"
                        aria-label="WhatsApp"
                      >
                        <MessageCircle className="size-4" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-brand-palm/8 px-2 py-2">
                      <p className="text-[10px] text-muted-foreground">{tx('السعر', 'Price')}</p>
                      <p className={cn('ltr-data text-sm font-bold', order.status === 'cancelled' && 'line-through opacity-50')}>
                        {order.price_omr}
                      </p>
                    </div>
                    <div className="rounded-xl bg-rose-50 px-2 py-2">
                      <p className="text-[10px] text-rose-700/80">{tx('العمولة', 'Commission')}</p>
                      <p className="ltr-data text-sm font-bold text-rose-800">{order.commission_omr}</p>
                      {(() => {
                        const ch = order.payment_channel || channelFromPaymentMethod(order.payment_method)
                        const bd = calcCommissionBreakdown(Number.parseFloat(order.price_omr) || 0, ch)
                        return (
                          <p className="ltr-data mt-0.5 text-[9px] leading-tight text-rose-700/70">
                            <span className="font-semibold">CEO {bd.ceo.toFixed(2)}</span>
                            {' · '}
                            <span className="font-semibold text-sky-800">
                              {tx('مطور', 'Dev')} {bd.developer.toFixed(2)}
                            </span>
                            {bd.gateway > 0 ? ` · ${bd.gateway.toFixed(2)}` : ''}
                          </p>
                        )
                      })()}
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-2 py-2">
                      <p className="text-[10px] text-emerald-700/80">{tx('الصافي', 'Net')}</p>
                      <p className="ltr-data text-sm font-bold text-emerald-800">{order.net_revenue_omr}</p>
                    </div>
                  </div>

                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    disabled={updatingId === order.id}
                    className={selectClass}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]?.[lang]}
                      </option>
                    ))}
                  </select>

                  {renderActions(order)}

                  {order.notes ? (
                    <details className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                      <summary className="cursor-pointer select-none font-semibold text-brand-palm">
                        {tx('ملخص الطلب', 'Order brief')}
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap font-sans leading-relaxed">{order.notes}</pre>
                    </details>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
      )}

          <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl bg-brand-palm px-4 py-3 text-brand-cream">
          <span className="text-sm">{tx('عمولة CEO', 'CEO')}</span>
          <strong className="ltr-data">
            {filtered
              .reduce((s, o) => {
                const ch = o.payment_channel || channelFromPaymentMethod(o.payment_method)
                return s + calcCommissionBreakdown(Number.parseFloat(o.price_omr) || 0, ch).ceo
              }, 0)
              .toFixed(2)}{' '}
            OMR
          </strong>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-sky-700 px-4 py-3 text-white">
          <span className="text-sm">{tx('عمولة المطور', 'Developer')}</span>
          <strong className="ltr-data">
            {filtered
              .reduce((s, o) => {
                const ch = o.payment_channel || channelFromPaymentMethod(o.payment_method)
                return s + calcCommissionBreakdown(Number.parseFloat(o.price_omr) || 0, ch).developer
              }, 0)
              .toFixed(2)}{' '}
            OMR
          </strong>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-emerald-700 px-4 py-3 text-white">
          <span className="text-sm">{tx('الصافي', 'Net')}</span>
          <strong className="ltr-data">{totals.net.toFixed(2)} OMR</strong>
        </div>
      </div>
    </div>
  )
}
