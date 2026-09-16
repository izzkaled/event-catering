'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Copy, MessageCircle, Download, Mail } from 'lucide-react'
import { toast } from 'sonner'
import type { Order } from '@/lib/db/schema'
import {
  MUSCAT_AREAS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  formatPhoneDisplay,
} from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const STATUSES = ['pending', 'confirmed', 'active', 'cancelled', 'completed'] as const

export function OrdersPanel() {
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
            ? 'تم تأكيد العرض / الطلب'
            : status === 'cancelled'
              ? 'تم إلغاء الطلب — تم إعلام العميل'
              : 'تم تحديث الحالة',
        )
      } else {
        toast.error('فشل تحديث الحالة')
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
            ? 'تم التخطي — تحقق من RESEND_API_KEY على Netlify'
            : 'تم إعادة إرسال الإشعار',
        )
      } else {
        toast.error(data?.error || 'فشل إرسال الإشعار')
      }
    } catch {
      toast.error('فشل إرسال الإشعار')
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
    const headers = [
      'رقم الطلب',
      'الاسم',
      'الجوال',
      'المنطقة',
      'الباقة',
      'السعر',
      'العمولة',
      'الصافي',
      'الحالة',
      'التاريخ',
    ]
    const rows = filtered.map((o) => [
      o.order_number,
      o.customer_name,
      o.customer_phone,
      o.customer_area,
      o.package_name_ar || `${o.hours_per_visit}h/${o.visits_per_week}v`,
      o.price_omr,
      o.commission_omr,
      o.net_revenue_omr,
      o.status,
      o.created_at,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orders.csv'
    a.click()
  }

  if (loading) return <p className="text-muted-foreground">جاري التحميل...</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="بحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border px-3 text-sm"
        >
          <option value="">كل الحالات</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]?.ar}
            </option>
          ))}
        </select>
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="h-10 rounded-md border px-3 text-sm"
        >
          <option value="">كل المناطق</option>
          {MUSCAT_AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="size-4" />
          تصدير CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الطلب</TableHead>
              <TableHead>الجهة / المسؤول</TableHead>
              <TableHead>الموقع</TableHead>
              <TableHead>الباقة</TableHead>
              <TableHead>تاريخ المناسبة</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>العمولة</TableHead>
              <TableHead>الصافي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{order.customer_name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {formatPhoneDisplay(order.customer_phone)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(order.customer_phone)
                          toast.success('تم النسخ')
                        }}
                      >
                        <Copy className="size-3" />
                      </button>
                      <a
                        href={`https://wa.me/${order.customer_phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="size-3 text-primary" />
                      </a>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{order.customer_area}</TableCell>
                <TableCell>
                  <div className="text-sm font-medium">
                    {order.package_name_ar || 'باقة ضيافة'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.visits_per_week} شخص · {order.hours_per_visit} ساعة
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  <div>{order.start_date}</div>
                  {order.preferred_time && (
                    <div className="text-muted-foreground">{order.preferred_time}</div>
                  )}
                </TableCell>
                <TableCell className={order.status === 'cancelled' ? 'text-muted-foreground line-through' : ''}>
                  {order.price_omr}
                </TableCell>
                <TableCell className={order.status === 'cancelled' ? 'text-muted-foreground' : 'text-red-600'}>
                  {order.commission_omr}
                </TableCell>
                <TableCell className={order.status === 'cancelled' ? 'text-muted-foreground' : 'text-primary'}>
                  {order.net_revenue_omr}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span
                      className={cn(
                        'inline-flex w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                        ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.pending,
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]?.ar || order.status}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS_LABELS[s]?.ar}
                        </option>
                      ))}
                    </select>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    {order.status === 'pending' ? (
                      <Button
                        size="sm"
                        disabled={updatingId === order.id}
                        onClick={() => updateStatus(order.id, 'confirmed')}
                        className="gap-1"
                      >
                        <CheckCircle2 className="size-3.5" />
                        تأكيد العرض
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
                      className="gap-1"
                    >
                      <Download className="size-3.5" />
                      فاتورة PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={notifyingId === order.id}
                      onClick={() => resendNotification(order.id)}
                      className="gap-1"
                    >
                      <Mail className="size-3.5" />
                      {notifyingId === order.id ? 'جاري الإرسال...' : 'إعادة إرسال'}
                    </Button>
                    {order.notes ? (
                      <details className="max-w-[220px] text-xs text-muted-foreground">
                        <summary className="cursor-pointer select-none text-[#4A234A]">ملخص الطلب</summary>
                        <pre className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/40 p-2 font-sans leading-relaxed">
                          {order.notes}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-6 rounded-xl border border-border bg-secondary/30 p-4 text-sm">
        <span>
          الإجمالي: <strong>{totals.price.toFixed(2)} OMR</strong>
        </span>
        <span className="text-red-600">
          العمولات: <strong>{totals.commission.toFixed(2)} OMR</strong>
        </span>
        <span className="text-primary">
          الصافي: <strong>{totals.net.toFixed(2)} OMR</strong>
        </span>
        <span>{filtered.length} طلب</span>
      </div>
    </div>
  )
}
