'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Stats = {
  monthlyRevenue: Record<string, number>
  packageBreakdown: Record<string, number>
  areaBreakdown: Record<string, number>
}

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)']

const barConfig = {
  revenue: { label: 'الإيراد', color: 'var(--color-chart-1)' },
} satisfies ChartConfig

export function ReportsPanel() {
  const [stats, setStats] = useState<Stats | null>(null)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (!stats) return <p className="text-muted-foreground">جاري التحميل...</p>

  const monthlyData = Object.entries(stats.monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, revenue]) => ({
      month: month.slice(5) + '/' + month.slice(2, 4),
      revenue,
    }))

  const packageData = Object.entries(stats.packageBreakdown).map(([name, value]) => ({ name, value }))
  const areaData = Object.entries(stats.areaBreakdown).map(([name, value]) => ({ name, value }))

  const commissionTable = Object.entries(stats.monthlyRevenue)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12)
    .map(([month, revenue]) => ({
      month,
      revenue,
      commission: Math.round(revenue * 0.15 * 100) / 100,
      net: Math.round(revenue * 0.85 * 100) / 100,
    }))

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>إيراد شهري (آخر 12 شهر)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barConfig} className="h-[280px] w-full">
            <BarChart data={monthlyData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>توزيع الباقات</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: 'الطلبات', color: 'var(--color-chart-1)' } }} className="h-[240px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={packageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {packageData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع المناطق</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ value: { label: 'الطلبات', color: 'var(--color-chart-2)' } }} className="h-[240px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={areaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {areaData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جدول العمولات الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-right">الشهر</th>
                  <th className="p-2 text-right">الإيراد</th>
                  <th className="p-2 text-right text-red-600">العمولة 15%</th>
                  <th className="p-2 text-right text-primary">الصافي 85%</th>
                </tr>
              </thead>
              <tbody>
                {commissionTable.map((row) => (
                  <tr key={row.month} className="border-b">
                    <td className="p-2">{row.month}</td>
                    <td className="p-2">{row.revenue.toFixed(2)} OMR</td>
                    <td className="p-2 text-red-600">{row.commission.toFixed(2)} OMR</td>
                    <td className="p-2 text-primary">{row.net.toFixed(2)} OMR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
