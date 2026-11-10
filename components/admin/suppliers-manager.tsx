'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowUpRight,
  Building2,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_SUPPLIER_ID } from '@/lib/db/schema'
import type { SupplierListItem } from '@/lib/admin/supplier-stats-shared'
import { currentMonthKey } from '@/lib/admin/supplier-stats-shared'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
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

type FormState = {
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  logo_url: string
  contact_phone: string
  contact_email: string
}

const emptyForm = (): FormState => ({
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  logo_url: '',
  contact_phone: '',
  contact_email: '',
})

function money(n: number, lang: 'ar' | 'en') {
  const v = n.toLocaleString(lang === 'ar' ? 'ar-OM' : 'en-OM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return lang === 'ar' ? `${v} ر.ع` : `OMR ${v}`
}

function monthOptions(count = 8) {
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

const selectClass =
  'h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-10 sm:w-auto sm:min-w-[11rem]'

export function SuppliersManager() {
  const { tx, lang } = useLanguage()
  const [month, setMonth] = useState(currentMonthKey())
  const [rows, setRows] = useState<SupplierListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [show, setShow] = useState(false)
  const [q, setQ] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const months = useMemo(() => monthOptions(8), [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/suppliers?with_stats=1&month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setRows(Array.isArray(data.suppliers) ? data.suppliers : [])
      }
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    load()
  }, [load])

  const activeRows = useMemo(
    () => rows.filter((r) => r.is_active !== false),
    [rows],
  )

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return activeRows
    return activeRows.filter(
      (r) =>
        r.name_ar.toLowerCase().includes(term) ||
        r.name_en.toLowerCase().includes(term) ||
        (r.contact_phone || '').includes(term) ||
        (r.contact_email || '').toLowerCase().includes(term),
    )
  }, [activeRows, q])

  const totals = useMemo(
    () => ({
      suppliers: activeRows.length,
      orders: activeRows.reduce((s, r) => s + r.month_orders, 0),
      cancelled: activeRows.reduce((s, r) => s + (r.month_cancelled || 0), 0),
      gross: activeRows.reduce((s, r) => s + r.month_gross_omr, 0),
      paid: activeRows.reduce((s, r) => s + r.month_paid_omr, 0),
      unpaid: activeRows.reduce((s, r) => s + Math.max(0, r.month_gross_omr - r.month_paid_omr), 0),
      packages: activeRows.reduce((s, r) => s + r.packages_count, 0),
    }),
    [activeRows],
  )

  const monthLabel =
    lang === 'ar'
      ? months.find((m) => m.value === month)?.labelAr
      : months.find((m) => m.value === month)?.labelEn

  const create = async () => {
    if (!form.name_ar.trim() || !form.name_en.trim()) {
      toast.error(tx('الاسم مطلوب بالعربي والإنجليزي', 'AR and EN names are required'))
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        toast.error(tx('تعذر الحفظ', 'Could not save'))
        return
      }
      toast.success(tx('تمت إضافة المورد', 'Supplier added'))
      setForm(emptyForm())
      setShow(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (id === DEFAULT_SUPPLIER_ID) {
      toast.error(tx('لا يمكن حذف المورد الافتراضي', 'Cannot delete the default supplier'))
      return
    }
    if (
      !confirm(
        tx(
          'إلغاء تفعيل المورد؟ ستُنقل خدماته وباقاته للمورد الافتراضي.',
          'Deactivate supplier? Services and packages move to the default supplier.',
        ),
      )
    ) {
      return
    }
    const res = await fetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(tx('تم التعطيل', 'Deactivated'))
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || tx('تعذر الحذف', 'Could not delete'))
    }
  }

  return (
    <div className="@container mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 border-b border-foreground/8 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-sm text-muted-foreground">
          {tx(
            'احتساب إيراد كل مورد شهرياً — جاهز لنهاية الشهر.',
            'Monthly supplier revenue settlement for month-end close.',
          )}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap">
          <Button
            render={<Link href="/admin/services" />}
            nativeButton={false}
            variant="outline"
            className="min-h-11 w-full sm:min-h-10 sm:w-auto"
          >
            {tx('مكتبة الخدمات', 'Services library')}
          </Button>
          <Button className="min-h-11 w-full sm:min-h-10 sm:w-auto" onClick={() => setShow((v) => !v)}>
            <Plus className="size-4" />
            {tx('مورد جديد', 'New supplier')}
          </Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-foreground/18 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-foreground/15 bg-[var(--paper-deep)] px-3 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">{tx('ملخص الاحتساب الشهري', 'Monthly settlement summary')}</h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {tx('الفترة', 'Period')}: <span className="font-semibold text-foreground">{monthLabel}</span>
            </p>
          </div>
          <label className="flex w-full flex-col gap-1.5 text-sm sm:w-auto sm:flex-row sm:items-center sm:gap-2">
            <span className="text-muted-foreground">{tx('الشهر', 'Month')}</span>
            <select className={selectClass} value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {lang === 'ar' ? m.labelAr : m.labelEn}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="bg-[var(--paper-deep)]/50 p-3 sm:p-4">
          {loading && rows.length === 0 ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-foreground/10 bg-white/70" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: tx('موردون', 'Suppliers'), value: String(totals.suppliers) },
                {
                  label: tx('طلبات فعّالة', 'Active orders'),
                  value: String(totals.orders),
                  note:
                    totals.cancelled > 0
                      ? `${totals.cancelled} ${tx('ملغى', 'cancelled')}`
                      : undefined,
                },
                { label: tx('إجمالي', 'Gross'), value: money(totals.gross, lang) },
                { label: tx('محصّل', 'Collected'), value: money(totals.paid, lang) },
                { label: tx('متبقي', 'Outstanding'), value: money(totals.unpaid, lang) },
                { label: tx('باقات', 'Packages'), value: String(totals.packages) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-foreground/15 bg-white px-3 py-3 shadow-sm sm:px-3.5"
                >
                  <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                  <p className="ltr-data mt-1.5 break-all text-base font-extrabold tracking-tight sm:text-lg">
                    {item.value}
                  </p>
                  {'note' in item && item.note ? (
                    <p className="mt-1 text-[10px] font-medium text-amber-800">{item.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {show && (
        <section className="space-y-4 rounded-2xl bg-card p-3 ring-1 ring-foreground/10 sm:p-5">
          <div className="flex items-center justify-between gap-2 border-b border-foreground/8 pb-3">
            <h2 className="text-sm font-bold">{tx('إضافة مورد', 'Add supplier')}</h2>
            <Button variant="ghost" size="sm" onClick={() => setShow(false)}>
              {tx('إغلاق', 'Close')}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{tx('الاسم عربي', 'Name (AR)')}</Label>
              <Input
                className="mt-1.5 h-11"
                value={form.name_ar}
                onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
              />
            </div>
            <div>
              <Label>{tx('الاسم إنجليزي', 'Name (EN)')}</Label>
              <Input
                className="mt-1.5 h-11"
                value={form.name_en}
                onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{tx('الوصف عربي', 'Description (AR)')}</Label>
              <Textarea
                className="mt-1.5"
                rows={2}
                value={form.description_ar}
                onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{tx('الوصف إنجليزي', 'Description (EN)')}</Label>
              <Textarea
                className="mt-1.5"
                rows={2}
                value={form.description_en}
                onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
              />
            </div>
            <div>
              <Label>{tx('هاتف', 'Phone')}</Label>
              <Input
                className="mt-1.5 h-11"
                value={form.contact_phone}
                onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
              />
            </div>
            <div>
              <Label>{tx('بريد', 'Email')}</Label>
              <Input
                className="mt-1.5 h-11"
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                kind="service"
                label={tx('الشعار', 'Logo')}
                value={form.logo_url}
                onChange={(url) => setForm((f) => ({ ...f, logo_url: url }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 border-t border-foreground/8 pt-3 sm:flex sm:flex-wrap">
            <Button disabled={saving} onClick={create} className="min-h-11 w-full sm:min-h-10 sm:w-auto">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {tx('حفظ المورد', 'Save supplier')}
            </Button>
            <Button
              variant="outline"
              className="min-h-11 w-full sm:min-h-10 sm:w-auto"
              onClick={() => setShow(false)}
            >
              {tx('إلغاء', 'Cancel')}
            </Button>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-foreground/18 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-foreground/15 bg-[var(--paper-deep)] p-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">{tx('دليل الموردين', 'Supplier directory')}</h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {filtered.length} {tx('من', 'of')} {totals.suppliers} · {monthLabel}
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 border-foreground/15 bg-white ps-9 sm:h-10"
              placeholder={tx('بحث بالاسم أو الهاتف...', 'Search name or phone...')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            {tx('جاري التحميل...', 'Loading...')}
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            {tx('لا يوجد موردون مطابقون', 'No matching suppliers')}
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="space-y-3 bg-[var(--paper-deep)]/40 p-3 md:hidden">
              {filtered.map((row) => {
                const unpaid = Math.max(0, row.month_gross_omr - row.month_paid_omr)
                return (
                  <li
                    key={row.id}
                    className="space-y-3 rounded-xl border border-foreground/15 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[var(--paper-deep)] ring-1 ring-foreground/15">
                        {row.logo_url ? (
                          <Image src={row.logo_url} alt="" fill className="object-cover" sizes="48px" />
                        ) : (
                          <span className="grid size-full place-items-center text-muted-foreground">
                            <Building2 className="size-4" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate font-semibold">
                            {lang === 'ar' ? row.name_ar : row.name_en}
                          </p>
                          {row.id === DEFAULT_SUPPLIER_ID && (
                            <span className="rounded border border-brand-sand/50 bg-brand-sand/30 px-1.5 py-0.5 text-[10px] font-semibold text-brand-palm">
                              {tx('افتراضي', 'Default')}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {lang === 'ar' ? row.name_en : row.name_ar}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {row.packages_count} {tx('باقة', 'pkg')} · {row.services_count}{' '}
                          {tx('خدمة', 'svc')}
                        </p>
                      </div>
                    </div>

                    {(row.month_cancelled || 0) > 0 && row.month_orders === 0 ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
                        {row.month_cancelled} {tx('طلب ملغى هذا الشهر — لا إيراد للاحتساب', 'cancelled this month — no billable revenue')}
                      </p>
                    ) : null}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-foreground/15 bg-[var(--paper-deep)] px-2 py-2">
                        <p className="text-[10px] text-muted-foreground">{tx('طلبات', 'Orders')}</p>
                        <p className="ltr-data mt-0.5 text-sm font-bold">{row.month_orders}</p>
                      </div>
                      <div className="rounded-xl border border-foreground/15 bg-[var(--paper-deep)] px-2 py-2">
                        <p className="text-[10px] text-muted-foreground">{tx('إجمالي', 'Gross')}</p>
                        <p className="ltr-data mt-0.5 text-[11px] font-bold leading-snug">
                          {money(row.month_gross_omr, lang)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-2 py-2">
                        <p className="text-[10px] text-emerald-800/70">{tx('محصّل', 'Paid')}</p>
                        <p className="ltr-data mt-0.5 text-[11px] font-bold leading-snug text-emerald-900">
                          {money(row.month_paid_omr, lang)}
                        </p>
                        {unpaid > 0 && (
                          <p className="ltr-data mt-0.5 text-[10px] text-amber-800">
                            {money(unpaid, lang)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Button
                        render={<Link href={`/admin/suppliers/${row.id}?month=${month}`} />}
                        nativeButton={false}
                        className="min-h-11"
                      >
                        {tx('احتساب', 'Settle')}
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                      <div className="flex gap-1.5">
                        <Button
                          render={<Link href={`/admin/services?supplier=${row.id}`} />}
                          nativeButton={false}
                          variant="outline"
                          className="min-h-11 px-3"
                        >
                          {tx('خدمات', 'Services')}
                        </Button>
                        {row.id !== DEFAULT_SUPPLIER_ID && (
                          <Button
                            variant="ghost"
                            className="min-h-11 px-3 text-muted-foreground hover:text-rose-700"
                            onClick={() => remove(row.id)}
                            aria-label={tx('تعطيل', 'Deactivate')}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
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
                    <TableHead className="ps-5">{tx('المورد', 'Supplier')}</TableHead>
                    <TableHead className="text-center">{tx('باقات', 'Packages')}</TableHead>
                    <TableHead className="text-center">{tx('خدمات', 'Services')}</TableHead>
                    <TableHead className="text-center">{tx('طلبات الشهر', 'Month orders')}</TableHead>
                    <TableHead className="text-end">{tx('إجمالي', 'Gross')}</TableHead>
                    <TableHead className="text-end">{tx('محصّل', 'Collected')}</TableHead>
                    <TableHead className="pe-5 text-end">{tx('إجراء', 'Action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => {
                    const unpaid = Math.max(0, row.month_gross_omr - row.month_paid_omr)
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="ps-5">
                          <div className="flex min-w-[12rem] items-center gap-3">
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-[var(--paper-deep)] ring-1 ring-foreground/10">
                              {row.logo_url ? (
                                <Image
                                  src={row.logo_url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <span className="grid size-full place-items-center text-muted-foreground">
                                  <Building2 className="size-4" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate font-semibold">
                                  {lang === 'ar' ? row.name_ar : row.name_en}
                                </p>
                                {row.id === DEFAULT_SUPPLIER_ID && (
                                  <span className="rounded bg-brand-sand/30 px-1.5 py-0.5 text-[10px] font-semibold text-brand-palm">
                                    {tx('افتراضي', 'Default')}
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {lang === 'ar' ? row.name_en : row.name_ar}
                                {row.contact_phone ? ` · ${row.contact_phone}` : ''}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="ltr-data text-center">{row.packages_count}</TableCell>
                        <TableCell className="ltr-data text-center">{row.services_count}</TableCell>
                        <TableCell className="text-center">
                          <p className="ltr-data font-semibold">{row.month_orders}</p>
                          {(row.month_cancelled || 0) > 0 ? (
                            <p className="text-[10px] text-amber-800">
                              {row.month_cancelled} {tx('ملغى', 'cancelled')}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="ltr-data text-end font-medium">
                          {money(row.month_gross_omr, lang)}
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="ltr-data font-medium text-emerald-800">
                            {money(row.month_paid_omr, lang)}
                          </div>
                          {unpaid > 0 && (
                            <div className="ltr-data text-[11px] text-amber-800">
                              {tx('متبقي', 'due')} {money(unpaid, lang)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="pe-5">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              render={
                                <Link href={`/admin/suppliers/${row.id}?month=${month}`} />
                              }
                              nativeButton={false}
                              size="sm"
                              className="h-9"
                            >
                              {tx('احتساب', 'Settle')}
                              <ArrowUpRight className="size-3.5" />
                            </Button>
                            <Button
                              render={<Link href={`/admin/services?supplier=${row.id}`} />}
                              nativeButton={false}
                              size="sm"
                              variant="outline"
                              className="h-9"
                            >
                              {tx('خدمات', 'Services')}
                            </Button>
                            {row.id !== DEFAULT_SUPPLIER_ID && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 text-muted-foreground hover:text-rose-700"
                                onClick={() => remove(row.id)}
                                aria-label={tx('تعطيل', 'Deactivate')}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </div>
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
    </div>
  )
}
