'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Apple,
  Banknote,
  CheckCircle2,
  CreditCard,
  Eye,
  Loader2,
  Percent,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AdminPaymentRow } from '@/lib/admin/payment-select'
import {
  COMMISSION_APPLE_PAY_FEE,
  COMMISSION_CARD_FEE,
  COMMISSION_CEO_RATE,
  COMMISSION_DEV_RATE,
  calcCommissionBreakdown,
  formatPhoneDisplay,
} from '@/lib/constants'
import {
  channelFromPaymentMethod,
  paymentChannelBadgeClass,
  paymentChannelLabel,
} from '@/lib/paymob/payment-channel'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

function resolvedChannel(o: AdminPaymentRow) {
  return o.payment_channel || channelFromPaymentMethod(o.payment_method)
}

export function PaymentsPanel() {
  const { lang, t, tx } = useLanguage()
  const [orders, setOrders] = useState<AdminPaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
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

  const paidOrders = useMemo(
    () => orders.filter((o) => o.payment_status === 'paid' || o.payment_status === 'partially_refunded'),
    [orders],
  )

  const summary = useMemo(() => {
    const byChannel = {
      visa: 0,
      mastercard: 0,
      apple_pay: 0,
      card: 0,
      bank_transfer: 0,
      other: 0,
    }
    let revenue = 0
    let commission = 0
    let net = 0
    let ceo = 0
    let developer = 0
    let gateway = 0
    for (const o of paidOrders) {
      const ch = resolvedChannel(o)
      if (ch === 'visa') byChannel.visa += 1
      else if (ch === 'mastercard') byChannel.mastercard += 1
      else if (ch === 'apple_pay') byChannel.apple_pay += 1
      else if (ch === 'bank_transfer') byChannel.bank_transfer += 1
      else if (ch === 'card' || ch === 'paymob') byChannel.card += 1
      else byChannel.other += 1
      const price = Number.parseFloat(o.price_omr) || 0
      const breakdown = calcCommissionBreakdown(price, ch)
      revenue += price
      commission += Number.parseFloat(o.commission_omr) || breakdown.total
      net += Number.parseFloat(o.net_revenue_omr) || breakdown.net
      ceo += breakdown.ceo
      developer += breakdown.developer
      gateway += breakdown.gateway
    }
    return { byChannel, revenue, commission, net, ceo, developer, gateway, count: paidOrders.length }
  }, [paidOrders])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return orders.filter((o) => {
      const ch = resolvedChannel(o)
      if (channelFilter) {
        if (channelFilter === 'card') {
          if (ch !== 'card' && ch !== 'paymob') return false
        } else if (ch !== channelFilter) {
          return false
        }
      }
      if (!q) return true
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.payment_status.toLowerCase().includes(q) ||
        o.payment_method.toLowerCase().includes(q) ||
        (o.payment_channel || '').toLowerCase().includes(q) ||
        (o.payment_card_last4 || '').includes(q) ||
        (o.paymob_transaction_id || '').includes(q)
      )
    })
  }, [orders, filter, channelFilter])

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
      toast.success(tx('تم التحديث', 'Updated'))
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

  const chips = [
    { key: '', label: tx('الكل', 'All') },
    { key: 'visa', label: 'Visa' },
    { key: 'mastercard', label: 'Mastercard' },
    { key: 'apple_pay', label: 'Apple Pay' },
    { key: 'bank_transfer', label: tx('تحويل بنكي', 'Bank') },
  ]

  return (
    <div className="@container space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{t('admin.payments.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tx(
              `CEO ${(COMMISSION_CEO_RATE * 100).toFixed(0)}% · مطور ${(COMMISSION_DEV_RATE * 100).toFixed(0)}% · بوابة (Apple Pay ${(COMMISSION_APPLE_PAY_FEE * 100).toFixed(1)}% / فيزا وماستر ${(COMMISSION_CARD_FEE * 100).toFixed(1)}%)`,
              `CEO ${(COMMISSION_CEO_RATE * 100).toFixed(0)}% · Dev ${(COMMISSION_DEV_RATE * 100).toFixed(0)}% · gateway (Apple Pay ${(COMMISSION_APPLE_PAY_FEE * 100).toFixed(1)}% / Visa·MC ${(COMMISSION_CARD_FEE * 100).toFixed(1)}%)`,
            )}
          </p>
        </div>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={tx('بحث بالطلب أو العميل أو ••••', 'Search order, customer, or last4')}
          className="max-w-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 @4xl:grid-cols-4">
        <Card className="border-0 bg-brand-palm text-brand-cream shadow-none">
          <CardContent className="flex items-center justify-between gap-2 p-4">
            <div>
              <p className="text-xs text-brand-cream/70">
                {tx('عمولة CEO', 'CEO commission')} ({(COMMISSION_CEO_RATE * 100).toFixed(0)}%)
              </p>
              <p className="ltr-data mt-1 text-xl font-extrabold">
                {summary.ceo.toFixed(2)}
                <span className="ms-1 text-xs font-semibold opacity-70">OMR</span>
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/15">
              <Percent className="size-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="border-0 bg-sky-700 text-white shadow-none">
          <CardContent className="flex items-center justify-between gap-2 p-4">
            <div>
              <p className="text-xs text-white/70">
                {tx('عمولة المطور', 'Developer commission')} ({(COMMISSION_DEV_RATE * 100).toFixed(0)}%)
              </p>
              <p className="ltr-data mt-1 text-xl font-extrabold">
                {summary.developer.toFixed(2)}
                <span className="ms-1 text-xs font-semibold opacity-70">OMR</span>
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/15">
              <Percent className="size-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="border-0 bg-rose-50 shadow-none ring-1 ring-rose-200/70">
          <CardContent className="flex items-center justify-between gap-2 p-4">
            <div>
              <p className="text-xs text-rose-900/70">{tx('إجمالي العمولات', 'Total commission')}</p>
              <p className="ltr-data mt-1 text-xl font-extrabold text-rose-800">
                {summary.commission.toFixed(2)}
                <span className="ms-1 text-xs font-semibold text-muted-foreground">OMR</span>
              </p>
              <p className="ltr-data mt-0.5 text-[11px] text-muted-foreground">
                {tx('بوابة', 'Gateway')} {summary.gateway.toFixed(2)} · {tx('صافي', 'Net')}{' '}
                {summary.net.toFixed(2)}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-rose-600 text-white">
              <Percent className="size-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="border-0 bg-sky-50 shadow-none ring-1 ring-sky-200/70">
          <CardContent className="flex items-center justify-between gap-2 p-4">
            <div>
              <p className="text-xs text-sky-900/70">Visa / Apple Pay / {tx('تحويل', 'Bank')}</p>
              <p className="ltr-data mt-1 text-2xl font-extrabold text-sky-900">
                {summary.byChannel.visa + summary.byChannel.apple_pay + summary.byChannel.bank_transfer + summary.byChannel.mastercard}
              </p>
              <p className="ltr-data mt-0.5 text-[11px] text-muted-foreground">
                V {summary.byChannel.visa} · AP {summary.byChannel.apple_pay} · MC {summary.byChannel.mastercard} · B{' '}
                {summary.byChannel.bank_transfer}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-sky-600 text-white">
              <CreditCard className="size-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 @4xl:grid-cols-3">
        <Card className="border-0 bg-zinc-900 text-white shadow-none">
          <CardContent className="flex items-center justify-between gap-2 p-4">
            <div>
              <p className="text-xs text-white/70">Apple Pay</p>
              <p className="ltr-data mt-1 text-2xl font-extrabold">{summary.byChannel.apple_pay}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/15">
              <Apple className="size-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="border-0 bg-amber-50 shadow-none ring-1 ring-amber-200/70">
          <CardContent className="flex items-center justify-between gap-2 p-4">
            <div>
              <p className="text-xs text-amber-900/70">{tx('تحويل بنكي', 'Bank transfer')}</p>
              <p className="ltr-data mt-1 text-2xl font-extrabold text-amber-900">
                {summary.byChannel.bank_transfer}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <Banknote className="size-5" />
            </span>
          </CardContent>
        </Card>
        <Card className="col-span-2 border-0 bg-orange-50 shadow-none ring-1 ring-orange-200/70 @4xl:col-span-1">
          <CardContent className="flex items-center justify-between gap-2 p-4">
            <div>
              <p className="text-xs text-orange-900/70">Mastercard</p>
              <p className="ltr-data mt-1 text-2xl font-extrabold text-orange-900">
                {summary.byChannel.mastercard}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-2xl bg-orange-500 text-white">
              <CreditCard className="size-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.key || 'all'}
            type="button"
            data-active={channelFilter === chip.key}
            onClick={() => setChannelFilter(chip.key)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition data-[active=true]:border-brand-palm data-[active=true]:bg-brand-palm data-[active=true]:text-brand-cream"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tx('الطلب', 'Order')}</TableHead>
              <TableHead>{tx('العميل', 'Customer')}</TableHead>
              <TableHead>{tx('المبلغ', 'Amount')}</TableHead>
              <TableHead>{tx('العمولة', 'Commission')}</TableHead>
              <TableHead>{tx('طريقة الدفع', 'Payment')}</TableHead>
              <TableHead>{tx('الحالة', 'Status')}</TableHead>
              <TableHead className="font-en">{tx('المرجع', 'Txn ID')}</TableHead>
              <TableHead>{tx('التاريخ', 'Date')}</TableHead>
              <TableHead>{tx('إجراءات', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => {
              const statusMeta = STATUS_LABEL[o.payment_status] || STATUS_LABEL.unpaid
              const channel = resolvedChannel(o)
              const busy = busyId === o.id
              return (
                <TableRow key={o.id}>
                  <TableCell className="ltr-data font-semibold">{o.order_number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{o.customer_name}</div>
                    <div className="ltr-data text-xs text-muted-foreground">
                      {formatPhoneDisplay(o.customer_phone)}
                    </div>
                  </TableCell>
                  <TableCell className="ltr-data tabular-nums font-semibold">
                    {Number.parseFloat(o.price_omr).toFixed(2)} OMR
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const price = Number.parseFloat(o.price_omr) || 0
                      const bd = calcCommissionBreakdown(price, channel)
                      return (
                        <div>
                          <div className="ltr-data text-sm font-bold text-rose-800">
                            {(Number.parseFloat(o.commission_omr) || bd.total).toFixed(2)}
                            <span className="ms-1 text-[10px] font-semibold text-muted-foreground">
                              {(bd.totalRate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="ltr-data text-[10px] text-muted-foreground">
                            <span className="font-semibold text-brand-palm">
                              CEO {bd.ceo.toFixed(2)}
                            </span>
                            {' · '}
                            <span className="font-semibold text-sky-800">
                              {tx('مطور', 'Dev')} {bd.developer.toFixed(2)}
                            </span>
                            {bd.gateway > 0 ? ` · ${tx('بوابة', 'Gate')} ${bd.gateway.toFixed(2)}` : ''}
                          </div>
                          <div className="ltr-data text-[11px] text-emerald-800">
                            {tx('صافي', 'net')} {(Number.parseFloat(o.net_revenue_omr) || bd.net).toFixed(2)}
                          </div>
                        </div>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        paymentChannelBadgeClass(channel),
                      )}
                    >
                      {channel === 'apple_pay' ? <Apple className="size-3" /> : null}
                      {channel === 'bank_transfer' ? <Banknote className="size-3" /> : null}
                      {(channel === 'visa' || channel === 'mastercard' || channel === 'card' || channel === 'paymob') && (
                        <CreditCard className="size-3" />
                      )}
                      {paymentChannelLabel(channel, lang)}
                      {o.payment_card_last4 ? (
                        <span className="ltr-data opacity-80">•••• {o.payment_card_last4}</span>
                      ) : null}
                    </span>
                  </TableCell>
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
                  <TableCell className="ltr-data truncate-cell-lg truncate text-xs">
                    {o.paymob_transaction_id || o.payment_reference || '—'}
                  </TableCell>
                  <TableCell className="ltr-data text-xs text-muted-foreground">
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
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  {tx('لا توجد مدفوعات', 'No payments found')}
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
                {tx('إغلاق', 'Close')}
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
