'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { SupplierApplication } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import {
  APPLICATION_STATUS_OPTIONS,
  KITCHEN_TYPE_OPTIONS,
  PREP_SPEED_OPTIONS,
  labelForOption,
} from '@/lib/suppliers/application-options'
import { SITE_URL } from '@/lib/seo'

const selectClass =
  'h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function money(v: string | null | undefined, lang: 'ar' | 'en') {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return lang === 'ar' ? `${n.toFixed(2)} ر.ع` : `OMR ${n.toFixed(2)}`
}

export function SupplierApplicationsPanel() {
  const { lang, tx } = useLanguage()
  const [rows, setRows] = useState<SupplierApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [copied, setCopied] = useState(false)
  const shareUrl = `${SITE_URL}/suppliers/join`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`
      const res = await fetch(`/api/admin/supplier-applications${q}`)
      if (!res.ok) {
        toast.error(tx('تعذر تحميل الطلبات', 'Could not load applications'))
        return
      }
      const data = await res.json()
      setRows(Array.isArray(data.applications) ? data.applications : [])
    } finally {
      setLoading(false)
    }
  }, [status, tx])

  useEffect(() => {
    void load()
  }, [load])

  const pendingCount = useMemo(
    () => rows.filter((r) => r.status === 'pending').length,
    [rows],
  )

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success(tx('تم نسخ رابط المشاركة', 'Share link copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(tx('تعذر النسخ', 'Could not copy'))
    }
  }

  const setRowStatus = async (id: string, next: string) => {
    const res = await fetch(`/api/admin/supplier-applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (!res.ok) {
      toast.error(tx('تعذر التحديث', 'Update failed'))
      return
    }
    const updated = (await res.json()) as SupplierApplication
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)))
    toast.success(tx('تم تحديث الحالة', 'Status updated'))
  }

  const remove = async (id: string) => {
    if (!confirm(tx('حذف هذا الطلب؟', 'Delete this application?'))) return
    const res = await fetch(`/api/admin/supplier-applications/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error(tx('تعذر الحذف', 'Delete failed'))
      return
    }
    setRows((prev) => prev.filter((r) => r.id !== id))
    toast.success(tx('تم الحذف', 'Deleted'))
  }

  return (
    <div className="@container mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 border-b border-foreground/8 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {tx(
              'طلبات تسجيل الموردين من الرابط العام — تظهر لك فقط في لوحة التحكم.',
              'Supplier signup requests from the public link — visible only in your admin dashboard.',
            )}
          </p>
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-brand-palm/20 bg-[var(--paper-deep)] p-3 sm:flex-row sm:items-center">
            <code className="ltr-data min-w-0 flex-1 truncate text-xs sm:text-sm">{shareUrl}</code>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={copyLink}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {tx('نسخ الرابط', 'Copy link')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="size-4" />
                {tx('فتح', 'Open')}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">{tx('كل الحالات', 'All statuses')}</option>
            {APPLICATION_STATUS_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {lang === 'ar' ? o.ar : o.en}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" onClick={() => void load()}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            {tx('تحديث', 'Refresh')}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-foreground/15 bg-card px-3 py-3">
          <p className="text-[11px] text-muted-foreground">{tx('المعروض', 'Shown')}</p>
          <p className="mt-1 text-xl font-extrabold">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
          <p className="text-[11px] text-amber-800">{tx('جديد', 'Pending')}</p>
          <p className="mt-1 text-xl font-extrabold text-amber-950">{pendingCount}</p>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          {tx('جاري التحميل...', 'Loading...')}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/15 px-4 py-16 text-center text-muted-foreground">
          {tx('لا توجد طلبات بعد — شارك الرابط مع الموردين.', 'No applications yet — share the link with suppliers.')}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <article
              key={row.id}
              className="overflow-hidden rounded-2xl border border-foreground/15 bg-card shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-foreground/10 bg-[var(--paper-deep)]/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold">{row.company_name}</h2>
                  <p className="ltr-data mt-0.5 text-sm text-muted-foreground">{row.contact_phone}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className={selectClass}
                    value={row.status}
                    onChange={(e) => void setRowStatus(row.id, e.target.value)}
                  >
                    {APPLICATION_STATUS_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {lang === 'ar' ? o.ar : o.en}
                      </option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="sm" onClick={() => void remove(row.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5">
                <Field
                  label={tx('سرعة التجهيز', 'Prep speed')}
                  value={labelForOption(PREP_SPEED_OPTIONS, row.prep_speed, lang)}
                />
                <Field
                  label={tx('نوع المطبخ', 'Kitchen')}
                  value={labelForOption(KITCHEN_TYPE_OPTIONS, row.kitchen_type, lang)}
                />
                <Field
                  label={tx('إنستغرام', 'Instagram')}
                  value={row.instagram ? `@${row.instagram}` : '—'}
                  ltr
                />
                <Field label={tx('إفطار', 'Breakfast')} value={money(row.breakfast_price_omr, lang)} />
                <Field label={tx('غداء', 'Lunch')} value={money(row.lunch_price_omr, lang)} />
                <Field label={tx('عشاء', 'Dinner')} value={money(row.dinner_price_omr, lang)} />
                <Field
                  label={tx('أقل عدد', 'Min qty')}
                  value={row.min_order_qty != null ? String(row.min_order_qty) : '—'}
                />
                <Field
                  label={tx('أقل سعر', 'Min price')}
                  value={money(row.min_order_price_omr, lang)}
                />
                <Field label={tx('الحلويات', 'Desserts')} value={row.desserts_type || '—'} />
              </div>

              {row.notes ? (
                <p className="border-t border-foreground/8 px-4 py-3 text-sm text-muted-foreground sm:px-5">
                  {row.notes}
                </p>
              ) : null}

              {(row.photo_urls?.length ?? 0) > 0 ? (
                <div className="grid grid-cols-2 gap-2 border-t border-foreground/8 p-4 sm:grid-cols-4 sm:p-5">
                  {row.photo_urls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-xl border border-foreground/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : null}

              <p className="border-t border-foreground/8 px-4 py-2 text-xs text-muted-foreground sm:px-5">
                {row.created_at
                  ? new Date(row.created_at).toLocaleString(lang === 'ar' ? 'ar-OM' : 'en-GB')
                  : ''}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  ltr,
}: {
  label: string
  value: string
  ltr?: boolean
}) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-[var(--paper-deep)]/35 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${ltr ? 'ltr-data' : ''}`}>{value}</p>
    </div>
  )
}
