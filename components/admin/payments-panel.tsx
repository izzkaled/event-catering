'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Eye,
  Loader2,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AdminPaymentRow } from '@/lib/admin/payment-select'
import { formatPhoneDisplay } from '@/lib/constants'
import { useLanguage } from '@/components/language-provider'
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

const METHOD_LABEL: Record<string, { ar: string; en: string }> = {
  paymob: { ar: 'Paymob', en: 'Paymob' },
  bank_transfer: { ar: 'تحويل بنكي', en: 'Bank transfer' },
  stripe: { ar: 'Stripe', en: 'Stripe' },
}

const STATUS_LABEL: Record<string, { ar: string; en: string; className: string }> = {
  unpaid: {
    ar: 'غير مدفوع',
    en: 'Unpaid',
    className: 'bg-muted text-muted-foreground',
  },
  pending_verification: {
    ar: 'بانتظار التحقق',
    en: 'Pending verification',
    className: 'bg-amber-100 text-amber-800',
  },
  paid: {
    ar: 'مدفوع',
    en: 'Paid',
    className: 'bg-emerald-100 text-emerald-800',
  },
  failed: {
    ar: 'فشل',
    en: 'Failed',
    className: 'bg-red-100 text-red-800',
  },
  refunded: {
    ar: 'مسترد',
    en: 'Refunded',
    className: 'bg-slate-200 text-slate-800',
  },
  partially_refunded: {
    ar: 'استرداد جزئي',
    en: 'Partial refund',
    className: 'bg-slate-200 text-slate-800',
  },
  not_required: {
    ar: 'غير مطلوب',
    en: 'Not required',
    className: 'bg-muted text-muted-foreground',
  },
}

export function PaymentsPanel() {
  const { lang, t } = useLanguage()
  const [orders, setOrders] = useState<AdminPaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    const res = await fetch('/api/admin/payments')
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPayments()
    const interval = setInterval(fetchPayments, 30000)
    return () => clearInterval(interval)
  }, [fetchPayments])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return orders.filter((o) => {
      if (!q) return true
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.payment_status.toLowerCase().includes(q) ||
        o.payment_method.toLowerCase().includes(q) ||
        (o.paymob_transaction_id || '').includes(q)
      )
    })
  }, [orders, filter])

  const patchPayment = async (id: string, action: string, notes?: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || 'Failed')
      }
      const updated = (await res.json()) as AdminPaymentRow
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
      toast.success(lang === 'ar' ? 'تم التحديث' : 'Updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusyId(null)
    }
  }

  const refund = async (order: AdminPaymentRow) => {
    const raw = window.prompt(
      lang === 'ar'
        ? `مبلغ الاسترداد بالريال (اتركه فارغاً للاسترداد الكامل — الإجمالي ${order.price_omr}):`
        : `Refund amount in OMR (leave blank for full — total ${order.price_omr}):`,
    )
    if (raw === null) return
    const reason =
      window.prompt(lang === 'ar' ? 'سبب الاسترداد:' : 'Refund reason:') || undefined
    setBusyId(order.id)
    try {
      const res = await fetch('/api/payment/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amountOmr: raw.trim() === '' ? undefined : raw.trim(),
          reason,
        }),
      })
      const data = (await res.json().catch(() => null)) as {
        error?: string
        order?: {
          payment_status?: string
          refund_status?: string | null
          refund_amount_omr?: string | null
        }
      } | null
      if (!res.ok) throw new Error(data?.error || 'Refund failed')
      if (data?.order) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  payment_status: data.order!.payment_status ?? o.payment_status,
                  refund_status: data.order!.refund_status ?? o.refund_status,
                  refund_amount_omr: data.order!.refund_amount_omr ?? o.refund_amount_omr,
                }
              : o,
          ),
        )
      }
      toast.success(lang === 'ar' ? 'تم الاسترداد' : 'Refunded')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Refund failed')
    } finally {
      setBusyId(null)
    }
  }

  const previewReceipt = async (orderId: string) => {
    setBusyId(orderId)
    try {
      const res = await fetch(`/api/admin/payments/${orderId}`)
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to load receipt')
      }
      setPreviewUrl(data.url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load receipt')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold">{t('admin.payments.title')}</h1>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
          className="max-w-xs"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{lang === 'ar' ? 'الطلب' : 'Order'}</TableHead>
              <TableHead>{lang === 'ar' ? 'العميل' : 'Customer'}</TableHead>
              <TableHead>{lang === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
              <TableHead>{lang === 'ar' ? 'الطريقة' : 'Method'}</TableHead>
              <TableHead>{lang === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{lang === 'ar' ? 'المرجع' : 'Txn ID'}</TableHead>
              <TableHead>{lang === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
              <TableHead>{lang === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => {
              const statusMeta = STATUS_LABEL[o.payment_status] || STATUS_LABEL.unpaid
              const methodMeta = METHOD_LABEL[o.payment_method] || {
                ar: o.payment_method,
                en: o.payment_method,
              }
              const busy = busyId === o.id
              return (
                <TableRow key={o.id}>
                  <TableCell className="font-semibold">{o.order_number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatPhoneDisplay(o.customer_phone)}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {Number.parseFloat(o.price_omr).toFixed(2)} OMR
                  </TableCell>
                  <TableCell>{lang === 'ar' ? methodMeta.ar : methodMeta.en}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        statusMeta.className,
                      )}
                    >
                      {lang === 'ar' ? statusMeta.ar : statusMeta.en}
                    </span>
                  </TableCell>
                  <TableCell className="truncate-cell-lg truncate text-xs">
                    {o.paymob_transaction_id || o.payment_reference || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {o.paid_at
                      ? new Date(o.paid_at).toLocaleString()
                      : o.created_at
                        ? new Date(o.created_at).toLocaleString()
                        : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {o.hasReceipt && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => previewReceipt(o.id)}
                        >
                          <Eye className="size-3.5" />
                          {t('admin.payments.receipt')}
                        </Button>
                      )}
                      {o.payment_status === 'pending_verification' && (
                        <>
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => patchPayment(o.id, 'approve')}
                          >
                            <CheckCircle2 className="size-3.5" />
                            {t('admin.payments.approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => patchPayment(o.id, 'reject')}
                          >
                            <XCircle className="size-3.5" />
                            {t('admin.payments.reject')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => patchPayment(o.id, 'request_receipt')}
                          >
                            <RotateCcw className="size-3.5" />
                            {t('admin.payments.request')}
                          </Button>
                        </>
                      )}
                      {o.payment_method === 'paymob' &&
                        (o.payment_status === 'paid' ||
                          o.payment_status === 'partially_refunded') && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => refund(o)}
                          >
                            {t('admin.payments.refund')}
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  {lang === 'ar' ? 'لا توجد مدفوعات' : 'No payments found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="max-h-[90vh] w-full max-w-[min(48rem,92vw)] overflow-auto rounded-xl bg-background p-4 shadow-xl">
            <div className="mb-3 flex justify-end">
              <Button variant="outline" onClick={() => setPreviewUrl(null)}>
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
            </div>
            {previewUrl.startsWith('data:application/pdf') || previewUrl.endsWith('.pdf') ? (
              <iframe src={previewUrl} className="h-[70vh] w-full rounded-lg border" title="Receipt" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Receipt" className="mx-auto max-h-[70vh] rounded-lg" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
