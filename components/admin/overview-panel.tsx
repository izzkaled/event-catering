'use client'

import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import Link from 'next/link'
import {
  Apple,
  BadgeCheck,
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  ConciergeBell,
  CreditCard,
  Eye,
  MapPin,
  Percent,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { ORDER_STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/db/schema'

type Stats = {
  liveVisitors: number
  todayVisits: number
  monthVisits: number
  dailyVisits?: { day: string; visits: number }[]
  totalOrders: number
  statusCounts: Record<string, number>
  totalRevenue: number
  totalCommission: number
  totalCeoCommission?: number
  totalDevCommission?: number
  totalGatewayFee?: number
  totalNet: number
  monthlyRevenue: Record<string, number>
  monthlyOrders?: Record<string, number>
  paymentChannelCounts?: {
    visa: number
    mastercard: number
    apple_pay: number
    card: number
    bank_transfer: number
    other: number
  }
  recentOrders: Order[]
  notifications: { id: string; message: string; is_read: boolean }[]
}

const visitsConfig = {
  visits: { label: 'Visits', color: 'var(--brand-palm)' },
} satisfies ChartConfig

const ordersConfig = {
  orders: { label: 'Orders', color: 'var(--brand-sand)' },
} satisfies ChartConfig

const STATUS_META: {
  key: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  icon: ComponentType<{ className?: string }>
  wrap: string
  iconWrap: string
  color: string
}[] = [
  { key: 'pending', icon: Clock, wrap: 'bg-amber-50 ring-amber-200/70', iconWrap: 'bg-amber-500 text-white', color: '#f59e0b' },
  { key: 'confirmed', icon: CheckCircle2, wrap: 'bg-emerald-50 ring-emerald-200/70', iconWrap: 'bg-emerald-600 text-white', color: '#059669' },
  { key: 'active', icon: ConciergeBell, wrap: 'bg-sky-50 ring-sky-200/70', iconWrap: 'bg-sky-600 text-white', color: '#0284c7' },
  { key: 'completed', icon: BadgeCheck, wrap: 'bg-brand-palm/8 ring-brand-palm/15', iconWrap: 'bg-brand-palm text-brand-cream', color: '#4a234a' },
  { key: 'cancelled', icon: XCircle, wrap: 'bg-rose-50 ring-rose-200/70', iconWrap: 'bg-rose-600 text-white', color: '#e11d48' },
]

const ORDER_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-emerald-100 text-emerald-900',
  active: 'bg-sky-100 text-sky-900',
  cancelled: 'bg-rose-100 text-rose-900',
  completed: 'bg-brand-palm/12 text-brand-palm',
}

function lastMonths(n: number) {
  const keys: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function OverviewPanel() {
  const { t, lang, tx } = useLanguage()
  const [stats, setStats] = useState<Stats | null>(null)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const visitChart = useMemo(() => {
    const rows = stats?.dailyVisits
    if (rows?.length) {
      return rows.map((row) => ({
        label: row.day.slice(8, 10) + '/' + row.day.slice(5, 7),
        visits: row.visits,
      }))
    }
    return []
  }, [stats])

  const orderChart = useMemo(() => {
    if (!stats) return []
    return lastMonths(6).map((key) => ({
      month: key.slice(5) + '/' + key.slice(2, 4),
      orders: stats.monthlyOrders?.[key] || 0,
      revenue: stats.monthlyRevenue[key] || 0,
    }))
  }, [stats])

  const statusPie = useMemo(() => {
    if (!stats) return []
    return STATUS_META.map((item) => ({
      key: item.key,
      name: ORDER_STATUS_LABELS[item.key]?.[lang] || item.key,
      value: stats.statusCounts[item.key] || 0,
      color: item.color,
    })).filter((item) => item.value > 0)
  }, [stats, lang])

  if (!stats) {
    return (
      <div className="@container grid grid-cols-2 gap-3 @4xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse border-0 shadow-none ring-1 ring-foreground/8">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: t('admin.overview.totalRevenue'),
      amount: stats.totalRevenue.toFixed(2),
      suffix: 'OMR',
      icon: Wallet,
      wrap: 'bg-brand-sand/20',
      iconWrap: 'bg-brand-sand text-brand-palm',
    },
    {
      label: tx('عمولة CEO (9%)', 'CEO commission (9%)'),
      amount: (stats.totalCeoCommission ?? 0).toFixed(2),
      suffix: 'OMR',
      icon: Percent,
      wrap: 'bg-brand-palm/10',
      iconWrap: 'bg-brand-palm text-brand-cream',
    },
    {
      label: tx('عمولة المطور (3%)', 'Developer commission (3%)'),
      amount: (stats.totalDevCommission ?? 0).toFixed(2),
      suffix: 'OMR',
      icon: Percent,
      wrap: 'bg-sky-50',
      iconWrap: 'bg-sky-700 text-white',
    },
    {
      label: t('admin.overview.netRevenue'),
      amount: stats.totalNet.toFixed(2),
      suffix: 'OMR',
      icon: TrendingUp,
      wrap: 'bg-emerald-50',
      iconWrap: 'bg-emerald-700 text-white',
    },
  ]

  return (
    <div className="@container flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm">
          <Users className="size-3.5 sm:size-4" />
          <span className="ltr-data">{stats.liveVisitors}</span>
          {t('admin.overview.liveVisitors')}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-900 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm">
          <Eye className="size-3.5 sm:size-4" />
          {t('admin.overview.todayVisits')}
          <span className="ltr-data">{stats.todayVisits}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-sand/30 px-2.5 py-1 text-[11px] font-semibold text-brand-palm sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm">
          <CalendarDays className="size-3.5 sm:size-4" />
          {t('admin.overview.monthVisits')}
          <span className="ltr-data">{stats.monthVisits}</span>
        </span>
        {stats.notifications.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white sm:px-3 sm:py-1.5 sm:text-sm">
            <Bell className="size-3.5" />
            {stats.notifications.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 @4xl:grid-cols-4">
        {cards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={cn('border-0 shadow-none ring-1 ring-foreground/8', stat.wrap)}>
              <CardContent className="flex items-center justify-between gap-2 p-3 @4xl:gap-3 @4xl:p-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground @4xl:text-xs">{stat.label}</p>
                  <p className="ltr-data mt-1 text-lg font-extrabold leading-none tracking-tight @4xl:text-2xl">
                    {stat.amount}
                    {stat.suffix ? (
                      <span className="ms-1 text-[10px] font-semibold text-muted-foreground @4xl:text-sm">
                        {stat.suffix}
                      </span>
                    ) : null}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-2xl @4xl:size-11',
                    stat.iconWrap,
                  )}
                >
                  <Icon className="size-4 @4xl:size-5" />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {(() => {
        const ch = stats.paymentChannelCounts
        if (!ch) return null
        const rows = [
          { key: 'visa', label: 'Visa', count: ch.visa, icon: CreditCard, wrap: 'bg-sky-50 ring-sky-200/70', iconWrap: 'bg-sky-600 text-white' },
          { key: 'mastercard', label: 'Mastercard', count: ch.mastercard, icon: CreditCard, wrap: 'bg-orange-50 ring-orange-200/70', iconWrap: 'bg-orange-500 text-white' },
          { key: 'apple_pay', label: 'Apple Pay', count: ch.apple_pay, icon: Apple, wrap: 'bg-zinc-900 text-white ring-zinc-700', iconWrap: 'bg-white/15 text-white' },
          { key: 'bank', label: tx('تحويل بنكي', 'Bank'), count: ch.bank_transfer, icon: Banknote, wrap: 'bg-amber-50 ring-amber-200/70', iconWrap: 'bg-amber-500 text-white' },
          { key: 'card', label: tx('بطاقة', 'Card'), count: ch.card, icon: CreditCard, wrap: 'bg-indigo-50 ring-indigo-200/70', iconWrap: 'bg-indigo-600 text-white' },
        ].filter((r) => r.count > 0 || r.key === 'visa' || r.key === 'apple_pay' || r.key === 'bank')
        return (
          <Card className="border-0 shadow-none ring-1 ring-foreground/8">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
                <Percent className="size-4" />
              </span>
              <div>
                <CardTitle>{tx('تتبع طرق الدفع', 'Payment method tracking')}</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tx('CEO 9% · مطور 3% · بوابة حسب الطريقة', 'CEO 9% · Dev 3% · gateway by method')}
                </p>
              </div>
              <Button
                render={<Link href="/admin/payments" />}
                nativeButton={false}
                variant="outline"
                size="sm"
                className="ms-auto"
              >
                {tx('التفاصيل', 'Details')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 @3xl:grid-cols-5">
                {rows.map((row) => {
                  const Icon = row.icon
                  return (
                    <div key={row.key} className={cn('flex items-center gap-2 rounded-xl px-2.5 py-2 ring-1', row.wrap)}>
                      <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', row.iconWrap)}>
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="ltr-data text-sm font-extrabold leading-none">{row.count}</p>
                        <p className="mt-0.5 truncate text-[10px] font-medium opacity-80">{row.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      <div className="grid gap-4 @4xl:grid-cols-5">
        <Card className="border-0 shadow-none ring-1 ring-foreground/8 @4xl:col-span-3">
          <CardHeader className="flex flex-row items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
              <Eye className="size-4" />
            </span>
            <div>
              <CardTitle>{tx('زوار آخر 14 يوم', 'Unique visitors — last 14 days')}</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tx('شخص واحد = مرة واحدة يومياً', 'One person counted once per day')}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={visitsConfig} className="aspect-auto h-56 w-full">
              <AreaChart data={visitChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} className="ltr-data" />
                <YAxis allowDecimals={false} width={32} tickLine={false} axisLine={false} className="ltr-data" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="var(--brand-palm)"
                  fill="var(--brand-sand)"
                  fillOpacity={0.45}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none ring-1 ring-foreground/8 @4xl:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-palm/10 text-brand-palm">
              <ClipboardList className="size-4" />
            </span>
            <div>
              <CardTitle>{tx('حالات الطلبات', 'Order status')}</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tx('توزيع كل الطلبات', 'Breakdown of all orders')}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {statusPie.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{t('admin.overview.noOrders')}</p>
            ) : (
              <ChartContainer
                config={{ value: { label: tx('طلبات', 'Orders'), color: 'var(--brand-palm)' } }}
                className="aspect-auto h-40 w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={70} strokeWidth={2}>
                    {statusPie.map((item) => (
                      <Cell key={item.key} fill={item.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            <div className="grid w-full grid-cols-2 gap-2">
              {STATUS_META.map((item) => {
                const Icon = item.icon
                const count = stats.statusCounts[item.key] || 0
                return (
                  <div key={item.key} className={cn('flex items-center gap-2 rounded-xl px-2.5 py-2 ring-1', item.wrap)}>
                    <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', item.iconWrap)}>
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="ltr-data text-sm font-extrabold leading-none">{count}</p>
                      <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">
                        {ORDER_STATUS_LABELS[item.key]?.[lang]}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 @4xl:grid-cols-2">
        <Card className="border-0 shadow-none ring-1 ring-foreground/8">
          <CardHeader className="flex flex-row items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-sand/30 text-brand-palm">
              <TrendingUp className="size-4" />
            </span>
            <div>
              <CardTitle>{tx('الطلبات آخر 6 أشهر', 'Orders — last 6 months')}</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tx('عدد الطلبات شهرياً', 'Number of orders each month')}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ordersConfig} className="aspect-auto h-56 w-full">
              <BarChart data={orderChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="ltr-data" />
                <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} className="ltr-data" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--brand-sand)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none ring-1 ring-foreground/8">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                <ClipboardList className="size-4" />
              </span>
              <CardTitle>{t('admin.overview.recentOrders')}</CardTitle>
            </div>
            <Button render={<Link href="/admin/orders" />} nativeButton={false} variant="ghost" size="sm" className="text-brand-palm">
              {tx('عرض الكل', 'View all')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2.5">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="ltr-data font-mono text-xs text-brand-sand">{order.order_number}</p>
                    <p className="truncate font-semibold">{order.customer_name}</p>
                    {order.customer_area ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3 text-brand-terracotta" />
                        {order.customer_area}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="ltr-data font-bold text-brand-palm">{order.price_omr} OMR</p>
                    <span
                      className={cn(
                        'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        ORDER_STATUS_BADGE[order.status] || ORDER_STATUS_BADGE.pending,
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]?.[lang] || order.status}
                    </span>
                  </div>
                </div>
              ))}
              {stats.recentOrders.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">{t('admin.overview.noOrders')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
