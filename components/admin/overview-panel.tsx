'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  TrendingUp,
  ClipboardList,
  Wallet,
  Bell,
  Users,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/language-provider'
import { ORDER_STATUS_LABELS } from '@/lib/constants'
import type { Order } from '@/lib/db/schema'

type Stats = {
  liveVisitors: number
  todayVisits: number
  monthVisits: number
  totalOrders: number
  statusCounts: Record<string, number>
  totalRevenue: number
  totalCommission: number
  totalNet: number
  monthlyRevenue: Record<string, number>
  recentOrders: Order[]
  notifications: { id: string; message: string; is_read: boolean }[]
}

const chartConfig = {
  revenue: { label: 'OMR', color: 'var(--color-chart-1)' },
} satisfies ChartConfig

export function OverviewPanel() {
  const { t, lang } = useLanguage()
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

  if (!stats) return <p className="text-muted-foreground">{t('admin.overview.loading')}</p>

  const chartData = Object.entries(stats.monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, revenue]) => ({
      month: month.slice(5) + '/' + month.slice(0, 4),
      revenue,
    }))

  const cards = [
    { label: t('admin.overview.totalRevenue'), value: `${stats.totalRevenue.toFixed(2)} OMR`, icon: Wallet },
    { label: t('admin.overview.commission'), value: `${stats.totalCommission.toFixed(2)} OMR`, icon: TrendingUp },
    { label: t('admin.overview.netRevenue'), value: `${stats.totalNet.toFixed(2)} OMR`, icon: Wallet },
    { label: t('admin.overview.totalOrders'), value: String(stats.totalOrders), icon: ClipboardList },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Users className="size-4" />
            {stats.liveVisitors} {t('admin.overview.liveVisitors')}
          </span>
          <span className="text-sm text-muted-foreground">
            {t('admin.overview.todayVisits')}: {stats.todayVisits} | {t('admin.overview.monthVisits')}: {stats.monthVisits}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {stats.notifications.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <Bell className="size-3" />
              {stats.notifications.length}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="text-2xl font-extrabold">{stat.value}</span>
                </div>
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(['pending', 'confirmed', 'active', 'completed'] as const).map((s) => (
          <Card key={s}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.statusCounts[s] || 0}</p>
              <p className="text-sm text-muted-foreground">{ORDER_STATUS_LABELS[s]?.[lang]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.overview.revenue6m')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <AreaChart data={chartData} margin={{ right: 12, left: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.overview.recentOrders')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <div>
                    <p className="font-bold">{order.order_number}</p>
                    <p className="text-muted-foreground">{order.customer_name}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{order.price_omr} OMR</p>
                    <Badge variant="outline">{ORDER_STATUS_LABELS[order.status]?.[lang] || order.status}</Badge>
                  </div>
                </div>
              ))}
              {stats.recentOrders.length === 0 && (
                <p className="text-center text-muted-foreground">{t('admin.overview.noOrders')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
