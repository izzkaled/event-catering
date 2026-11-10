'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Loader2,
  Printer,
  Save,
  Settings2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { SupplierStats } from '@/lib/admin/supplier-stats-shared'
import { currentMonthKey } from '@/lib/admin/supplier-stats-shared'
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

type TabId = 'settlement' | 'orders' | 'profile'

function money(n: number, lang: 'ar' | 'en') {
  const v = n.toLocaleString(lang === 'ar' ? 'ar-OM' : 'en-OM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return lang === 'ar' ? `${v} ر.ع` : `OMR ${v}`
}

function monthOptions(count = 12) {
  const opts: { value: string; labelAr: string; labelEn: string }[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    opts.push({
      value,
      labelAr: d.toLocaleDateString('ar-OM', { month: 'long', year: 'numeric' }),
      labelEn: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    })
  }
  return opts
}

const chartConfig = {
  revenue: { label: 'Revenue', color: 'var(--brand-palm)' },
} satisfies ChartConfig

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-emerald-100 text-emerald-900',
  active: 'bg-sky-100 text-sky-900',
  cancelled: 'bg-rose-100 text-rose-900',
  completed: 'bg-brand-palm/12 text-brand-palm',
}

const selectClass =
  'h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-10 sm:w-auto sm:min-w-[11rem]'

export function SupplierDetail({ supplierId }: { supplierId: string }) {
  const { tx, lang } = useLanguage()
  const router = useRouter()
  const search = useSearchParams()
  const [month, setMonth] = useState(search.get('month') || currentMonthKey())
  const [tab, setTab] = useState<TabId>('settlement')
  const [stats, setStats] = useState<SupplierStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [edit, setEdit] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    logo_url: '',
    contact_phone: '',
    contact_email: '',
  })
  const months = useMemo(() => monthOptions(12), [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/suppliers/${supplierId}/stats?month=${month}`)
      if (!res.ok) {
        toast.error(tx('تعذر تحميل بيانات المورد', 'Could not load supplier'))
        setStats(null)
        return
      }
      const data = (await res.json()) as SupplierStats
      setStats(data)
      setEdit({
        name_ar: data.supplier.name_ar || '',
        name_en: data.supplier.name_en || '',
        description_ar: data.supplier.description_ar || '',
        description_en: data.supplier.description_en || '',
        logo_url: data.supplier.logo_url || '',
        contact_phone: data.supplier.contact_phone || '',
        contact_email: data.supplier.contact_email || '',
      })
    } finally {
      setLoading(false)
    }
  }, [supplierId, month, tx])

  useEffect(() => {
    load()
  }, [load])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/suppliers/${supplierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edit),
      })
      if (!res.ok) {
        toast.error(tx('تعذر الحفظ', 'Could not save'))
        return
      }
      toast.success(tx('تم حفظ بيانات المورد', 'Supplier saved'))
      await load()
    } finally {
      setSaving(false)
    }
  }

  const changeMonth = (next: string) => {
    setMonth(next)
    router.replace(`/admin/suppliers/${supplierId}?month=${next}`)
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        {tx('جاري التحميل...', 'Loading...')}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-16 text-center">
        <p className="font-semibold">{tx('المورد غير موجود', 'Supplier not found')}</p>
        <Button render={<Link href="/admin/suppliers" />} nativeButton={false} className="mt-4">
          {tx('العودة للموردين', 'Back to suppliers')}
        </Button>
      </div>
    )
  }

  const s = stats.settlement
  const monthLabel =
    lang === 'ar'
      ? months.find((m) => m.value === month)?.labelAr
      : months.find((m) => m.value === month)?.labelEn
  const chartData = stats.daily_orders.map((d) => ({
    day: d.day.slice(8),
    revenue: d.revenue,
  }))

  const tabs: { id: TabId; label: string; short: string; icon: typeof Wallet; count?: number }[] = [
    {
      id: 'settlement',
      label: tx('الاحتساب', 'Settlement'),
      short: tx('احتساب', 'Settle'),
      icon: Wallet,
    },
    {
      id: 'orders',
      label: tx('الطلبات', 'Orders'),
      short: tx('طلبات', 'Orders'),
      icon: ClipboardList,
      count: stats.recent_orders.length,
    },
    {
      id: 'profile',
      label: tx('البيانات', 'Profile'),
      short: tx('بيانات', 'Profile'),
      icon: Settings2,
    },
  ]

  return (
    <div className="@container mx-auto w-full max-w-7xl space-y-4 pb-8 sm:space-y-5 print:space-y-3">
      <header className="border-b border-foreground/8 pb-4">
        <Button
          render={<Link href="/admin/suppliers" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ms-2 mb-2 h-8 print:hidden"
        >
          <ArrowRight className="size-4 rtl:rotate-180" />
          {tx('الموردون', 'Suppliers')}
        </Button>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-foreground/10 sm:size-14">
              {stats.supplier.logo_url ? (
                <Image
                  src={stats.supplier.logo_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <span className="grid size-full place-items-center text-muted-foreground">
                  <Building2 className="size-5" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-extrabold tracking-tight sm:text-2xl">
                {lang === 'ar' ? stats.supplier.name_ar : stats.supplier.name_en}
              </h1>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {lang === 'ar' ? stats.supplier.name_en : stats.supplier.name_ar}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.catalog.active_packages} {tx('باقة', 'pkg')} · {stats.catalog.services}{' '}
                {tx('خدمة', 'svc')}
                {stats.supplier.contact_phone ? (
                  <span className="ltr-data"> · {stats.supplier.contact_phone}</span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 print:hidden sm:flex sm:flex-wrap sm:items-center">
            <label className="flex w-full flex-col gap-1.5 text-sm sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              <span className="text-muted-foreground">{tx('شهر الاحتساب', 'Settlement month')}</span>
              <select
                className={selectClass}
                value={month}
                onChange={(e) => changeMonth(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {lang === 'ar' ? m.labelAr : m.labelEn}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                variant="outline"
                className="min-h-11 w-full sm:min-h-10 sm:w-auto"
                onClick={() => window.print()}
              >
                <Printer className="size-4" />
                {tx('طباعة', 'Print')}
              </Button>
              <Button
                render={<Link href={`/admin/services?supplier=${supplierId}`} />}
                nativeButton={false}
                variant="outline"
                className="min-h-11 w-full sm:min-h-10 sm:w-auto"
              >
                {tx('الخدمات', 'Services')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="print:hidden">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--paper-deep)] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 text-center text-xs font-semibold transition-colors sm:min-h-10 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm',
                tab === t.id
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-foreground/8'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="flex items-center gap-1">
                <t.icon className="size-3.5 sm:size-4" />
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </span>
              {typeof t.count === 'number' ? (
                <span className="ltr-data rounded-md bg-foreground/6 px-1.5 py-0.5 text-[10px] sm:text-[11px]">
                  {t.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </nav>

      <div className={cn('space-y-4', tab !== 'settlement' && 'hidden print:block')}>
        <section className="overflow-hidden rounded-2xl border border-foreground/18 bg-card shadow-sm print:break-inside-avoid">
            <div className="border-b border-foreground/15 bg-[var(--paper-deep)] px-3 py-3 sm:px-5">
              <h2 className="text-sm font-bold">
                {tx('احتساب', 'Settlement')} · {monthLabel}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tx(
                  'أرقام الشهر بعد استبعاد الملغى من الإيراد.',
                  'Month figures exclude cancelled orders from revenue.',
                )}
              </p>
              {s.orders_total > 0 && s.orders_cancelled === s.orders_total ? (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950">
                  {tx(
                    `كل طلبات هذا الشهر ملغاة (${s.orders_cancelled}) — لا يوجد مبلغ للاحتساب.`,
                    `All ${s.orders_cancelled} orders this month are cancelled — nothing to settle.`,
                  )}
                </p>
              ) : null}
            </div>

          <div className="grid grid-cols-2 gap-2.5 bg-[var(--paper-deep)]/50 p-3 sm:p-4 lg:grid-cols-4">
            {[
              {
                label: tx('طلبات', 'Orders'),
                value: String(s.orders_total),
                note: `${s.orders_completed} ${tx('مكتمل', 'done')} · ${s.orders_cancelled} ${tx('ملغى', 'cancelled')}`,
              },
              {
                label: tx('إجمالي المبيعات', 'Gross sales'),
                value: money(s.gross_omr, lang),
                note: `${tx('عمولة', 'Commission')} ${money(s.commission_omr, lang)}`,
              },
              {
                label: tx('صافي المنصة', 'Platform net'),
                value: money(s.net_omr, lang),
                note: tx('بعد العمولة', 'After commission'),
              },
              {
                label: tx('محصّل', 'Collected'),
                value: money(s.paid_omr, lang),
                note: `${tx('متبقي', 'Outstanding')} ${money(s.unpaid_omr, lang)}`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-foreground/15 bg-white px-3 py-3 shadow-sm sm:px-4 sm:py-4"
              >
                <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                <p className="ltr-data mt-1.5 break-all text-base font-extrabold tracking-tight sm:text-xl">
                  {item.value}
                </p>
                <p className="mt-1 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </section>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <section className="rounded-2xl border border-foreground/12 bg-card p-3 shadow-sm sm:p-5 print:break-inside-avoid">
              <h3 className="border-b border-foreground/10 pb-2 text-sm font-bold">
                {tx('الإيراد اليومي', 'Daily revenue')}
              </h3>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto mt-3 h-44 w-full sm:h-52"
            >
              <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  interval="preserveStartEnd"
                  minTickGap={12}
                  className="ltr-data"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  width={32}
                  className="ltr-data"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--brand-palm)"
                  fill="var(--brand-sand)"
                  fillOpacity={0.45}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </section>

            <section className="rounded-2xl border border-foreground/12 bg-card p-3 shadow-sm sm:p-5 print:break-inside-avoid">
              <h3 className="border-b border-foreground/10 pb-2 text-sm font-bold">
                {tx('تفصيل الاحتساب', 'Settlement breakdown')}
              </h3>
              <div className="mt-3 space-y-2.5">
                {[
                  {
                    group: tx('الكتالوج', 'Catalog'),
                    rows: [
                      [tx('باقات منشورة', 'Published packages'), String(stats.catalog.active_packages)],
                      [tx('كل الباقات', 'All packages'), String(stats.catalog.packages)],
                      [tx('الخدمات', 'Services'), String(stats.catalog.services)],
                    ],
                  },
                  {
                    group: tx('الطلبات', 'Orders'),
                    rows: [
                      [tx('قيد التنفيذ', 'In pipeline'), String(s.orders_active_pipeline)],
                      [tx('مكتمل', 'Completed'), String(s.orders_completed)],
                      [tx('ملغى', 'Cancelled'), String(s.orders_cancelled)],
                    ],
                  },
                  {
                    group: tx('المبالغ', 'Amounts'),
                    rows: [
                      [tx('إجمالي', 'Gross'), money(s.gross_omr, lang)],
                      [tx('عمولة', 'Commission'), money(s.commission_omr, lang)],
                      [tx('صافي', 'Net'), money(s.net_omr, lang)],
                      [tx('محصّل', 'Collected'), money(s.paid_omr, lang)],
                      [tx('متبقي', 'Outstanding'), money(s.unpaid_omr, lang)],
                    ],
                  },
                ].map((block) => (
                  <div
                    key={block.group}
                    className="rounded-xl border border-foreground/12 bg-[var(--paper-deep)] p-3"
                  >
                    <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      {block.group}
                    </p>
                    <dl className="space-y-2 text-sm">
                      {block.rows.map(([k, v]) => (
                        <div
                          key={String(k)}
                          className="flex items-start justify-between gap-3 border-t border-foreground/8 pt-2 first:border-t-0 first:pt-0"
                        >
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="ltr-data shrink-0 font-semibold">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          </div>
      </div>

      {tab === 'orders' && (
        <section className="overflow-hidden rounded-2xl border border-foreground/12 bg-card shadow-sm print:hidden">
          <div className="flex items-center justify-between gap-2 border-b border-foreground/12 bg-[var(--paper-deep)]/55 px-3 py-3 sm:px-5">
            <div className="min-w-0">
              <h2 className="text-sm font-bold">{tx('طلبات الشهر', 'Month orders')}</h2>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{monthLabel}</p>
            </div>
            <span className="ltr-data shrink-0 text-xs text-muted-foreground">
              {stats.recent_orders.length} {tx('طلب', 'orders')}
            </span>
          </div>

          {!stats.recent_orders.length ? (
            <p className="px-4 py-14 text-center text-sm text-muted-foreground">
              {tx('لا طلبات في هذا الشهر لهذا المورد', 'No orders this month for this supplier')}
            </p>
          ) : (
            <>
              {/* Mobile order cards */}
              <ul className="space-y-2.5 p-3 md:hidden">
                {stats.recent_orders.map((o) => {
                  const st = ORDER_STATUS_LABELS[o.status]
                  const pay = PAYMENT_STATUS_LABELS[o.payment_status]
                  return (
                    <li key={o.id} className="space-y-2 rounded-xl border border-foreground/12 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="ltr-data font-semibold">{o.order_number}</p>
                          <p className="truncate text-sm">{o.customer_name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {lang === 'ar' ? o.package_name_ar : o.package_name_en}
                          </p>
                        </div>
                        <p className="ltr-data shrink-0 text-sm font-bold">
                          {money(parseFloat(o.price_omr) || 0, lang)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            STATUS_BADGE[o.status] || 'bg-muted',
                          )}
                        >
                          {st ? (lang === 'ar' ? st.ar : st.en) : o.status}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                          {pay ? (lang === 'ar' ? pay.ar : pay.en) : o.payment_status}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="ps-5">{tx('الطلب', 'Order')}</TableHead>
                      <TableHead>{tx('العميل', 'Customer')}</TableHead>
                      <TableHead>{tx('الباقة', 'Package')}</TableHead>
                      <TableHead>{tx('الحالة', 'Status')}</TableHead>
                      <TableHead>{tx('الدفع', 'Payment')}</TableHead>
                      <TableHead className="pe-5 text-end">{tx('المبلغ', 'Amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recent_orders.map((o) => {
                      const st = ORDER_STATUS_LABELS[o.status]
                      const pay = PAYMENT_STATUS_LABELS[o.payment_status]
                      return (
                        <TableRow key={o.id}>
                          <TableCell className="ltr-data ps-5 font-medium">
                            {o.order_number}
                          </TableCell>
                          <TableCell>{o.customer_name}</TableCell>
                          <TableCell className="max-w-[12rem] truncate">
                            {lang === 'ar' ? o.package_name_ar : o.package_name_en}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                STATUS_BADGE[o.status] || 'bg-muted',
                              )}
                            >
                              {st ? (lang === 'ar' ? st.ar : st.en) : o.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {pay ? (lang === 'ar' ? pay.ar : pay.en) : o.payment_status}
                          </TableCell>
                          <TableCell className="ltr-data pe-5 text-end font-semibold">
                            {money(parseFloat(o.price_omr) || 0, lang)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </section>
      )}

      {tab === 'profile' && (
        <section className="space-y-4 rounded-2xl border border-foreground/12 bg-card p-3 shadow-sm sm:p-5 print:hidden">
          <div className="border-b border-foreground/12 pb-3">
            <h2 className="text-sm font-bold">{tx('بيانات المورد', 'Supplier profile')}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {tx('الاسم والشعار وبيانات التواصل.', 'Name, logo, and contact details.')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{tx('الاسم عربي', 'Name (AR)')}</Label>
              <Input
                className="mt-1.5 h-11"
                value={edit.name_ar}
                onChange={(e) => setEdit((f) => ({ ...f, name_ar: e.target.value }))}
              />
            </div>
            <div>
              <Label>{tx('الاسم إنجليزي', 'Name (EN)')}</Label>
              <Input
                className="mt-1.5 h-11"
                value={edit.name_en}
                onChange={(e) => setEdit((f) => ({ ...f, name_en: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{tx('الوصف عربي', 'Description (AR)')}</Label>
              <Textarea
                className="mt-1.5"
                rows={2}
                value={edit.description_ar}
                onChange={(e) => setEdit((f) => ({ ...f, description_ar: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{tx('الوصف إنجليزي', 'Description (EN)')}</Label>
              <Textarea
                className="mt-1.5"
                rows={2}
                value={edit.description_en}
                onChange={(e) => setEdit((f) => ({ ...f, description_en: e.target.value }))}
              />
            </div>
            <div>
              <Label>{tx('هاتف', 'Phone')}</Label>
              <Input
                className="mt-1.5 h-11"
                value={edit.contact_phone}
                onChange={(e) => setEdit((f) => ({ ...f, contact_phone: e.target.value }))}
              />
            </div>
            <div>
              <Label>{tx('بريد', 'Email')}</Label>
              <Input
                className="mt-1.5 h-11"
                type="email"
                value={edit.contact_email}
                onChange={(e) => setEdit((f) => ({ ...f, contact_email: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                kind="service"
                label={tx('الشعار', 'Logo')}
                value={edit.logo_url}
                onChange={(url) => setEdit((f) => ({ ...f, logo_url: url }))}
              />
            </div>
          </div>
          <div className="border-t border-foreground/8 pt-3">
            <Button
              disabled={saving}
              onClick={saveProfile}
              className="min-h-11 w-full sm:min-h-10 sm:w-auto"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {tx('حفظ البيانات', 'Save profile')}
            </Button>
          </div>
        </section>
      )}

      <section className="hidden print:block print:break-inside-avoid">
        <h2 className="mb-2 text-sm font-bold">{tx('طلبات الشهر', 'Month orders')}</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-start">
              <th className="py-1">{tx('الطلب', 'Order')}</th>
              <th>{tx('العميل', 'Customer')}</th>
              <th className="text-end">{tx('المبلغ', 'Amount')}</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent_orders.map((o) => (
              <tr key={o.id} className="border-b border-foreground/10">
                <td className="py-1">{o.order_number}</td>
                <td>{o.customer_name}</td>
                <td className="text-end">{money(parseFloat(o.price_omr) || 0, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
