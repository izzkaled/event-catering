'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  ConciergeBell,
  Loader2,
  Plus,
  Search,
  Users,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import type { HospitalityService } from '@/lib/db/schema'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'

const CATS = [
  { id: 'food_beverage', ar: 'طعام وشراب', en: 'Food & beverage' },
  { id: 'setup', ar: 'تجهيز', en: 'Setup' },
  { id: 'staff', ar: 'طاقم', en: 'Staff' },
  { id: 'additional', ar: 'إضافي', en: 'Additional' },
] as const

const selectClass =
  'mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

type FormState = {
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  category: string
  pricing_model: 'fixed' | 'per_guest'
  price_omr: string
  image_url: string
}

const emptyForm = (): FormState => ({
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  category: 'food_beverage',
  pricing_model: 'fixed',
  price_omr: '',
  image_url: '',
})

export function ServicesLibrary() {
  const { tx, lang } = useLanguage()
  const [rows, setRows] = useState<HospitalityService[]>([])
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [form, setForm] = useState<FormState>(emptyForm)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/services')
    if (res.ok) setRows(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const active = useMemo(() => rows.filter((r) => !r.is_archived), [rows])

  const counts = useMemo(() => {
    const perGuest = active.filter((r) => r.pricing_model === 'per_guest').length
    const fixed = active.length - perGuest
    return { total: active.length, perGuest, fixed }
  }, [active])

  const filtered = useMemo(() => {
    return active.filter((r) => {
      if (catFilter !== 'all' && r.category !== catFilter) return false
      if (!q.trim()) return true
      const hay = `${r.name_ar} ${r.name_en} ${r.slug}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })
  }, [active, catFilter, q])

  const create = async () => {
    if (!form.name_ar.trim() || !form.name_en.trim()) {
      toast.error(tx('الاسم مطلوب بالعربي والإنجليزي', 'AR and EN names are required'))
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        toast.error(tx('فشل الإنشاء', 'Could not create'))
        return
      }
      toast.success(tx('تمت إضافة الخدمة', 'Service added'))
      setShow(false)
      setForm(emptyForm())
      await load()
    } finally {
      setSaving(false)
    }
  }

  const archive = async (id: string) => {
    const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(tx('تمت الأرشفة', 'Archived'))
      load()
    }
  }

  const patch = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) load()
    else toast.error(tx('فشل التحديث', 'Update failed'))
  }

  const catLabel = (id: string) => {
    const c = CATS.find((x) => x.id === id)
    return c ? (lang === 'ar' ? c.ar : c.en) : id
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        {tx('جاري التحميل...', 'Loading...')}
      </div>
    )
  }

  return (
    <div className="@container space-y-4 pb-6 sm:space-y-6">
      <div className="rounded-2xl bg-brand-palm/6 p-4 ring-1 ring-brand-palm/10 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-palm text-brand-cream">
                <ConciergeBell className="size-4" />
              </span>
              <span className="rounded-full bg-brand-sand/40 px-2.5 py-0.5 text-xs font-semibold text-brand-palm">
                {counts.total} {tx('خدمة', 'services')}
              </span>
            </div>
            <h1 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">
              {tx('مكتبة الخدمات', 'Services library')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tx(
                'سعر ثابت أو حسب عدد الضيوف (مثل البوفيه) — يُحدَّث تلقائياً في الطلب.',
                'Fixed price or per guest (e.g. buffet) — updates automatically in the request.',
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Button
              render={<Link href="/admin/packages" />}
              nativeButton={false}
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
            >
              {tx('الباقات', 'Packages')}
            </Button>
            <Button className="min-h-11 w-full gap-1.5 sm:w-auto" onClick={() => setShow((v) => !v)}>
              <Plus className="size-4" />
              {show ? tx('إغلاق', 'Close') : tx('خدمة جديدة', 'New service')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/8 sm:p-4">
          <p className="text-[11px] text-muted-foreground">{tx('الكل', 'Total')}</p>
          <p className="ltr-data mt-1 text-xl font-extrabold">{counts.total}</p>
        </div>
        <div className="rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-200/70 sm:p-4">
          <p className="text-[11px] text-sky-900/70">{tx('ثابت', 'Fixed')}</p>
          <p className="ltr-data mt-1 text-xl font-extrabold text-sky-900">{counts.fixed}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200/70 sm:p-4">
          <p className="text-[11px] text-amber-900/70">{tx('حسب الضيوف', 'Per guest')}</p>
          <p className="ltr-data mt-1 text-xl font-extrabold text-amber-900">{counts.perGuest}</p>
        </div>
      </div>

      {show ? (
        <div className="space-y-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/8 sm:p-5">
          <div>
            <h2 className="font-bold">{tx('إضافة خدمة', 'Add service')}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {tx(
                'اختر إن كان السعر ثابتاً أو يتغير بعدد الضيوف.',
                'Choose whether price is fixed or scales with guests.',
              )}
            </p>
          </div>
          <div className="grid gap-4 @2xl:grid-cols-2">
            <div>
              <Label className="font-ar">{tx('الاسم (عربي)', 'Name (AR)')}</Label>
              <Input
                className="input-ar mt-1.5 h-11"
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              />
            </div>
            <div>
              <Label className="font-en">{tx('الاسم (إنجليزي)', 'Name (EN)')}</Label>
              <Input
                className="input-en mt-1.5 h-11"
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              />
            </div>
            <div>
              <Label>{tx('التصنيف', 'Category')}</Label>
              <select
                className={selectClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'ar' ? c.ar : c.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{tx('نوع التسعير', 'Pricing type')}</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, pricing_model: 'fixed' })}
                  className={cn(
                    'flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold ring-1 transition',
                    form.pricing_model === 'fixed'
                      ? 'bg-brand-palm text-brand-cream ring-brand-palm'
                      : 'bg-background text-muted-foreground ring-foreground/10',
                  )}
                >
                  <Wallet className="size-4" />
                  {tx('سعر ثابت', 'Fixed')}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, pricing_model: 'per_guest' })}
                  className={cn(
                    'flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold ring-1 transition',
                    form.pricing_model === 'per_guest'
                      ? 'bg-amber-500 text-white ring-amber-500'
                      : 'bg-background text-muted-foreground ring-foreground/10',
                  )}
                >
                  <Users className="size-4" />
                  {tx('حسب الضيوف', 'Per guest')}
                </button>
              </div>
            </div>
            <div>
              <Label>
                {form.pricing_model === 'per_guest'
                  ? tx('السعر لكل ضيف (ر.ع)', 'Price per guest (OMR)')
                  : tx('السعر الثابت (ر.ع)', 'Fixed price (OMR)')}
              </Label>
              <Input
                className="ltr-data mt-1.5 h-11"
                value={form.price_omr}
                onChange={(e) => setForm({ ...form, price_omr: e.target.value })}
                placeholder={form.pricing_model === 'per_guest' ? '2.50' : '75.00'}
              />
              {form.pricing_model === 'per_guest' && form.price_omr ? (
                <p className="ltr-data mt-1.5 text-xs text-amber-800">
                  {tx('مثال', 'Example')}: 200 {tx('ضيف', 'guests')} ={' '}
                  {(Number(form.price_omr) * 200).toFixed(2)} OMR
                </p>
              ) : null}
            </div>
            <div className="@2xl:col-span-2">
              <ImageUploadField
                kind="service"
                label={tx('صورة الخدمة', 'Service image')}
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
              />
            </div>
            <div>
              <Label className="font-ar">{tx('الوصف (عربي)', 'Description (AR)')}</Label>
              <Textarea
                className="input-ar mt-1.5 min-h-24"
                value={form.description_ar}
                onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
              />
            </div>
            <div>
              <Label className="font-en">{tx('الوصف (إنجليزي)', 'Description (EN)')}</Label>
              <Textarea
                className="input-en mt-1.5 min-h-24"
                value={form.description_en}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
              />
            </div>
          </div>
          <Button disabled={saving} onClick={create} className="min-h-11 w-full sm:w-auto">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {tx('حفظ الخدمة', 'Save service')}
          </Button>
        </div>
      ) : null}

      <div className="rounded-2xl bg-card p-3 ring-1 ring-foreground/8 sm:p-4">
        <div className="flex flex-col gap-2 @2xl:flex-row @2xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tx('بحث في الخدمات...', 'Search services...')}
              className="h-11 ps-9"
            />
          </div>
          <select className={cn(selectClass, 'mt-0 @2xl:w-52')} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="all">{tx('كل التصنيفات', 'All categories')}</option>
            {CATS.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === 'ar' ? c.ar : c.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!filtered.length ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-14 text-center">
          <ConciergeBell className="mx-auto size-8 text-brand-sand" />
          <p className="mt-3 font-semibold">{tx('لا توجد خدمات', 'No services')}</p>
          <Button className="mt-5 min-h-11" onClick={() => setShow(true)}>
            <Plus className="size-4" />
            {tx('خدمة جديدة', 'New service')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 @3xl:grid-cols-2">
          {filtered.map((row) => {
            const perGuest = row.pricing_model === 'per_guest'
            return (
              <article key={row.id} className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {catLabel(row.category)}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          perGuest ? 'bg-amber-100 text-amber-900' : 'bg-sky-100 text-sky-900',
                        )}
                      >
                        {perGuest ? <Users className="size-3" /> : <Wallet className="size-3" />}
                        {perGuest ? tx('حسب الضيوف', 'Per guest') : tx('ثابت', 'Fixed')}
                      </span>
                    </div>
                    <h2 className="font-ar mt-2 truncate text-base font-bold">{row.name_ar}</h2>
                    <p className="font-en truncate text-xs text-muted-foreground">{row.name_en}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-rose-700"
                    onClick={() => archive(row.id)}
                  >
                    <Archive className="size-4" />
                  </Button>
                </div>

                {row.image_url ? (
                  <div className="overflow-hidden rounded-xl ring-1 ring-foreground/8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row.image_url} alt="" className="aspect-[4/3] w-full object-cover" />
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">{tx('نوع التسعير', 'Pricing')}</Label>
                    <select
                      className={cn(selectClass, 'mt-1 h-10')}
                      value={perGuest ? 'per_guest' : 'fixed'}
                      onChange={(e) =>
                        patch(row.id, {
                          pricing_model: e.target.value === 'per_guest' ? 'per_guest' : 'fixed',
                        })
                      }
                    >
                      <option value="fixed">{tx('سعر ثابت', 'Fixed price')}</option>
                      <option value="per_guest">{tx('حسب عدد الضيوف', 'Per guest')}</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px]">
                      {perGuest ? tx('ر.ع / ضيف', 'OMR / guest') : tx('السعر ر.ع', 'Price OMR')}
                    </Label>
                    <Input
                      className="ltr-data mt-1 h-10"
                      defaultValue={row.price_omr}
                      key={`${row.id}-${row.price_omr}`}
                      onBlur={(e) => {
                        if (e.target.value !== String(row.price_omr)) {
                          patch(row.id, { price_omr: e.target.value })
                        }
                      }}
                    />
                  </div>
                </div>

                {perGuest ? (
                  <p className="ltr-data rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200/70">
                    {tx('مثال', 'Example')}: 200 × {Number(row.price_omr).toFixed(2)} ={' '}
                    {(Number(row.price_omr) * 200).toFixed(2)} OMR
                  </p>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
