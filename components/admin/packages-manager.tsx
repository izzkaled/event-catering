'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  Copy,
  Eye,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  ChevronUp,
  ChevronDown,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Package as DbPackage } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'

type AdminPackage = DbPackage & {
  section_slug: string | null
  section_name_ar: string | null
  section_name_en: string | null
}

const STATUS_META: Record<string, { ar: string; en: string; className: string }> = {
  published: {
    ar: 'منشورة',
    en: 'Published',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  draft: {
    ar: 'مسودة',
    en: 'Draft',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  archived: {
    ar: 'مؤرشفة',
    en: 'Archived',
    className: 'border-slate-200 bg-slate-100 text-slate-800',
  },
  hidden: {
    ar: 'مخفية',
    en: 'Hidden',
    className: 'border-rose-200 bg-rose-50 text-rose-900',
  },
}

const selectClass =
  'h-11 w-full rounded-xl border border-foreground/15 bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function PackagesManager() {
  const { tx, lang } = useLanguage()
  const [packages, setPackages] = useState<AdminPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [maxFeatured, setMaxFeatured] = useState(3)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/packages')
    if (!res.ok) {
      toast.error(tx('فشل تحميل الباقات', 'Failed to load packages'))
      setLoading(false)
      return
    }
    const data = await res.json()
    setPackages(data.packages || data)
    setMaxFeatured(data.max_featured_packages || 3)
    setLoading(false)
  }, [tx])

  useEffect(() => {
    load()
  }, [load])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of packages) {
      for (const o of p.occasion_types || []) set.add(o)
    }
    return [...set].sort()
  }, [packages])

  const counts = useMemo(() => {
    const published = packages.filter((p) => p.status === 'published').length
    const draft = packages.filter((p) => p.status === 'draft').length
    const featured = packages.filter((p) => p.is_popular).length
    return { total: packages.length, published, draft, featured }
  }, [packages])

  const filtered = useMemo(() => {
    return packages.filter((p) => {
      if (status !== 'all' && p.status !== status) return false
      if (category !== 'all' && !(p.occasion_types || []).includes(category)) return false
      if (q.trim()) {
        const s = q.trim().toLowerCase()
        const hay = `${p.name_ar} ${p.name_en} ${p.slug || ''}`.toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [packages, q, status, category])

  const patch = async (id: string, data: Record<string, unknown>) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/packages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg = String(err.error || '')
        if (msg.toLowerCase().includes('maximum featured') || msg.includes('max_featured')) {
          toast.error(
            tx(
              `الحد الأقصى للباقات المميزة ${maxFeatured}. ألغِ تمييز باقة أخرى أولاً.`,
              `Max featured packages is ${maxFeatured}. Unfeature another package first.`,
            ),
          )
        } else {
          toast.error(err.error || tx('فشل التحديث', 'Update failed'))
        }
        return
      }
      toast.success(tx('تم التحديث', 'Updated'))
      await load()
    } finally {
      setBusyId(null)
    }
  }

  const duplicate = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/packages/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) {
        toast.error(tx('فشل النسخ', 'Duplicate failed'))
        return
      }
      const copy = await res.json()
      toast.success(tx('تم نسخ الباقة', 'Package duplicated'))
      window.location.href = `/admin/packages/${copy.id}`
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: string) => {
    if (
      !confirm(
        tx(
          'حذف الباقة نهائيًا؟ يفضّل الأرشفة بدل الحذف.',
          'Permanently delete this package? Archiving is safer.',
        ),
      )
    )
      return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/packages/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(tx('تم الحذف', 'Deleted'))
        await load()
      }
    } finally {
      setBusyId(null)
    }
  }

  const move = async (pkg: AdminPackage, dir: 'up' | 'down') => {
    const idx = packages.findIndex((p) => p.id === pkg.id)
    const swap = packages[dir === 'up' ? idx - 1 : idx + 1]
    if (!swap) return
    setBusyId(pkg.id)
    try {
      await Promise.all([
        fetch(`/api/admin/packages/${pkg.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: swap.sort_order }),
        }),
        fetch(`/api/admin/packages/${swap.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: pkg.sort_order }),
        }),
      ])
      await load()
    } finally {
      setBusyId(null)
    }
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
    <div className="@container mx-auto w-full max-w-7xl space-y-4 pb-6 sm:space-y-5">
      {/* Actions strip — title comes from admin shell */}
      <header className="flex flex-col gap-3 border-b border-foreground/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-sm text-muted-foreground">
          {tx(
            `التعديلات تظهر مباشرة للعميل · المميزة ${counts.featured}/${maxFeatured}`,
            `Changes go live immediately · Featured ${counts.featured}/${maxFeatured}`,
          )}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap">
          <Button
            render={<Link href="/admin/services" />}
            nativeButton={false}
            variant="outline"
            className="min-h-11 w-full sm:min-h-10 sm:w-auto"
          >
            {tx('الخدمات', 'Services')}
          </Button>
          <Button
            render={<Link href="/admin/package-categories" />}
            nativeButton={false}
            variant="outline"
            className="min-h-11 w-full sm:min-h-10 sm:w-auto"
          >
            {tx('التصنيفات', 'Categories')}
          </Button>
          <Button
            render={<Link href="/admin/packages/new" />}
            nativeButton={false}
            className="col-span-2 min-h-11 w-full gap-1.5 sm:col-span-1 sm:min-h-10 sm:w-auto"
          >
            <Plus className="size-4" />
            {tx('باقة جديدة', 'New package')}
          </Button>
        </div>
      </header>

      {/* Status summary */}
      <section className="overflow-hidden rounded-2xl border border-foreground/18 bg-card shadow-sm">
        <div className="border-b border-foreground/15 bg-[var(--paper-deep)] px-3 py-3 sm:px-5 sm:py-4">
          <h2 className="text-sm font-bold">{tx('ملخص الباقات', 'Packages overview')}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {tx('اضغط على بطاقة لتصفية القائمة.', 'Tap a card to filter the list.')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 bg-[var(--paper-deep)]/50 p-3 sm:grid-cols-4 sm:p-4">
          {[
            {
              label: tx('الكل', 'Total'),
              value: String(counts.total),
              onClick: () => setStatus('all'),
              active: status === 'all',
            },
            {
              label: tx('منشورة', 'Published'),
              value: String(counts.published),
              onClick: () => setStatus('published'),
              active: status === 'published',
            },
            {
              label: tx('مسودة', 'Draft'),
              value: String(counts.draft),
              onClick: () => setStatus('draft'),
              active: status === 'draft',
            },
            {
              label: tx('مميزة', 'Featured'),
              value: `${counts.featured}/${maxFeatured}`,
              onClick: () => {
                setStatus('all')
                setQ('')
              },
              active: false,
            },
          ].map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className={cn(
                'rounded-xl border bg-white px-3 py-3 text-start shadow-sm transition',
                card.active
                  ? 'border-brand-palm ring-2 ring-brand-palm/30'
                  : 'border-foreground/15 hover:border-foreground/25',
              )}
            >
              <p className="text-[11px] font-medium text-muted-foreground">{card.label}</p>
              <p className="ltr-data mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">
                {card.value}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Filters + list */}
      <section className="overflow-hidden rounded-2xl border border-foreground/18 bg-card shadow-sm">
        <div className="space-y-3 border-b border-foreground/15 bg-[var(--paper-deep)] p-3 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold">{tx('قائمة الباقات', 'Package list')}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {filtered.length} {tx('من', 'of')} {counts.total}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 @2xl:flex-row @2xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tx('بحث بالاسم أو الـ slug...', 'Search name or slug...')}
                className="h-11 border-foreground/15 bg-white ps-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 @2xl:flex @2xl:w-auto">
              <select
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">{tx('كل الحالات', 'All statuses')}</option>
                <option value="published">{tx('منشورة', 'Published')}</option>
                <option value="draft">{tx('مسودة', 'Draft')}</option>
                <option value="archived">{tx('مؤرشفة', 'Archived')}</option>
                <option value="hidden">{tx('مخفية', 'Hidden')}</option>
              </select>
              <select
                className={selectClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">{tx('كل التصنيفات', 'All categories')}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!filtered.length ? (
          <div className="px-4 py-14 text-center sm:px-6">
            <Package className="mx-auto size-8 text-brand-sand" />
            <p className="mt-3 font-semibold">{tx('لا توجد باقات مطابقة', 'No matching packages')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tx('أنشئ باقة جديدة أو عدّل الفلاتر.', 'Create a package or change filters.')}
            </p>
            <Button
              render={<Link href="/admin/packages/new" />}
              nativeButton={false}
              className="mt-5 min-h-11"
            >
              <Plus className="size-4" />
              {tx('باقة جديدة', 'New package')}
            </Button>
          </div>
        ) : (
          <ul className="grid gap-3 bg-[var(--paper-deep)]/40 p-3 sm:p-4 @3xl:grid-cols-2">
            {filtered.map((pkg) => {
              const st = STATUS_META[pkg.status] || STATUS_META.draft
              const busy = busyId === pkg.id
              const fullIdx = packages.findIndex((p) => p.id === pkg.id)
              return (
                <li
                  key={pkg.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-xl border border-foreground/15 bg-white p-3 shadow-sm sm:p-4',
                    busy && 'opacity-70',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                            st.className,
                          )}
                        >
                          {lang === 'ar' ? st.ar : st.en}
                        </span>
                        {pkg.is_popular ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-brand-sand/50 bg-brand-sand/35 px-2 py-0.5 text-[10px] font-semibold text-brand-palm">
                            <Star className="size-3 fill-current" />
                            {tx('مميزة', 'Featured')}
                          </span>
                        ) : null}
                        {pkg.is_recommended ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-brand-palm/25 bg-brand-palm/10 px-2 py-0.5 text-[10px] font-semibold text-brand-palm">
                            <Sparkles className="size-3" />
                            {tx('موصى بها', 'Recommended')}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="font-ar mt-2 truncate text-base font-bold">{pkg.name_ar}</h3>
                      <p className="font-en truncate text-xs text-muted-foreground">{pkg.name_en}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl border border-foreground/15 bg-[var(--paper-deep)] p-1">
                      <button
                        type="button"
                        disabled={busy || fullIdx <= 0}
                        onClick={() => move(pkg, 'up')}
                        className="rounded-lg p-1.5 hover:bg-white disabled:opacity-30"
                        aria-label={tx('أعلى', 'Up')}
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <span className="ltr-data text-[10px] font-semibold text-muted-foreground">
                        {pkg.sort_order}
                      </span>
                      <button
                        type="button"
                        disabled={busy || fullIdx < 0 || fullIdx >= packages.length - 1}
                        onClick={() => move(pkg, 'down')}
                        className="rounded-lg p-1.5 hover:bg-white disabled:opacity-30"
                        aria-label={tx('أسفل', 'Down')}
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 border-y border-foreground/10 py-2.5">
                    {(pkg.occasion_types || []).length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {tx('بدون تصنيف', 'No category')}
                      </span>
                    ) : (
                      (pkg.occasion_types || []).slice(0, 4).map((o) => (
                        <span
                          key={o}
                          className="ltr-data rounded-md border border-foreground/12 bg-[var(--paper-deep)] px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {o}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-foreground/15 bg-[var(--paper-deep)] px-2 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground">{tx('السعر', 'Price')}</p>
                      <p className="ltr-data mt-0.5 text-sm font-bold">
                        {Number(pkg.price_omr).toFixed(0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-2 py-2 text-center">
                      <p className="text-[10px] text-sky-800/70">{tx('الضيوف', 'Guests')}</p>
                      <p className="ltr-data mt-0.5 inline-flex items-center justify-center gap-1 text-sm font-bold text-sky-950">
                        <Users className="size-3.5" />
                        {pkg.min_guests ?? '—'}–{pkg.max_guests ?? '—'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-foreground/15 bg-[var(--paper-deep)] px-2 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground">{tx('مشاهدات', 'Views')}</p>
                      <p className="ltr-data mt-0.5 text-sm font-bold">{pkg.views_count ?? 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => patch(pkg.id, { is_popular: !pkg.is_popular })}
                      className={cn(
                        'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition',
                        pkg.is_popular
                          ? 'border-brand-sand/60 bg-brand-sand/35 text-brand-palm'
                          : 'border-foreground/15 bg-white text-muted-foreground',
                      )}
                    >
                      <Star className={cn('size-3.5', pkg.is_popular && 'fill-current')} />
                      {tx('مميزة', 'Featured')}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => patch(pkg.id, { is_recommended: !pkg.is_recommended })}
                      className={cn(
                        'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition',
                        pkg.is_recommended
                          ? 'border-brand-palm/30 bg-brand-palm/10 text-brand-palm'
                          : 'border-foreground/15 bg-white text-muted-foreground',
                      )}
                    >
                      <Sparkles className="size-3.5" />
                      {tx('موصى بها', 'Recommended')}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-foreground/10 pt-3 sm:grid-cols-3 @4xl:grid-cols-5">
                    <Button
                      render={<Link href={`/admin/packages/${pkg.id}`} />}
                      nativeButton={false}
                      size="sm"
                      className="col-span-2 min-h-10 gap-1.5 sm:col-span-1"
                    >
                      <Pencil className="size-3.5" />
                      {tx('تعديل', 'Edit')}
                    </Button>
                    <Button
                      render={<Link href={`/packages/${pkg.slug}/preview`} target="_blank" />}
                      nativeButton={false}
                      size="sm"
                      variant="outline"
                      className="min-h-10 gap-1"
                    >
                      <Eye className="size-3.5" />
                      {tx('معاينة', 'Preview')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      className="min-h-10 gap-1"
                      onClick={() => duplicate(pkg.id)}
                    >
                      <Copy className="size-3.5" />
                      {tx('نسخ', 'Copy')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      className="min-h-10 gap-1"
                      onClick={() => patch(pkg.id, { status: 'archived', is_active: false })}
                    >
                      <Archive className="size-3.5" />
                      {tx('أرشفة', 'Archive')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      className="min-h-10 gap-1 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      onClick={() => remove(pkg.id)}
                    >
                      <Trash2 className="size-3.5" />
                      {tx('حذف', 'Delete')}
                    </Button>
                  </div>

                  <p className="ltr-data text-[10px] text-muted-foreground">
                    {tx('آخر تحديث', 'Updated')}:{' '}
                    {pkg.updated_at
                      ? new Date(pkg.updated_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')
                      : '—'}
                    {' · '}C {pkg.customizations_count ?? 0} · R {pkg.requests_count ?? 0}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
