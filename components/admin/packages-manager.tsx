'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  Copy,
  Eye,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Package } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type AdminPackage = Package & {
  section_slug: string | null
  section_name_ar: string | null
  section_name_en: string | null
}

const STATUS_LABEL: Record<string, string> = {
  published: 'منشورة',
  draft: 'مسودة',
  archived: 'مؤرشفة',
  hidden: 'مخفية',
}

export function PackagesManager() {
  const [packages, setPackages] = useState<AdminPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [maxFeatured, setMaxFeatured] = useState(3)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/packages')
    if (!res.ok) {
      toast.error('فشل تحميل الباقات')
      setLoading(false)
      return
    }
    const data = await res.json()
    setPackages(data.packages || data)
    setMaxFeatured(data.max_featured_packages || 3)
    setLoading(false)
  }, [])

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
    const res = await fetch(`/api/admin/packages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'فشل التحديث')
      return
    }
    toast.success('تم التحديث')
    load()
  }

  const duplicate = async (id: string) => {
    const res = await fetch(`/api/admin/packages/${id}/duplicate`, { method: 'POST' })
    if (!res.ok) {
      toast.error('فشل النسخ')
      return
    }
    const copy = await res.json()
    toast.success('تم نسخ الباقة')
    window.location.href = `/admin/packages/${copy.id}`
  }

  const remove = async (id: string) => {
    if (!confirm('حذف الباقة نهائيًا؟ يفضّل الأرشفة بدل الحذف.')) return
    const res = await fetch(`/api/admin/packages/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('تم الحذف')
      load()
    }
  }

  const move = async (pkg: AdminPackage, dir: 'up' | 'down') => {
    const idx = packages.findIndex((p) => p.id === pkg.id)
    const swap = packages[dir === 'up' ? idx - 1 : idx + 1]
    if (!swap) return
    await Promise.all([
      patch(pkg.id, { sort_order: swap.sort_order }),
      patch(swap.id, { sort_order: pkg.sort_order }),
    ])
  }

  if (loading) return <p className="text-muted-foreground">جاري التحميل...</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إدارة الباقات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أي عدد من الباقات — كل تغيير يظهر مباشرة للعميل. الحد الأقصى للمميزة: {maxFeatured}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/admin/services" />} nativeButton={false} variant="outline">
            مكتبة الخدمات
          </Button>
          <Button render={<Link href="/admin/package-categories" />} nativeButton={false} variant="outline">
            التصنيفات
          </Button>
          <Button render={<Link href="/admin/packages/new" />} nativeButton={false} className="gap-1.5">
            <Plus className="size-4" />
            Create New Package
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search packages..."
            className="ps-9"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">كل الحالات</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
          <option value="hidden">Hidden</option>
        </select>
        <select
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {!filtered.length ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-semibold">لا توجد باقات مطابقة</p>
          <p className="mt-2 text-sm text-muted-foreground">أنشئ باقة جديدة أو عدّل الفلاتر.</p>
          <Button render={<Link href="/admin/packages/new" />} nativeButton={false} className="mt-6">
            Create New Package
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الترتيب</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Starting Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Analytics</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => move(pkg, 'up')} aria-label="up">
                        <ChevronUp className="size-4" />
                      </button>
                      <button type="button" onClick={() => move(pkg, 'down')} aria-label="down">
                        <ChevronDown className="size-4" />
                      </button>
                      <span className="text-xs text-muted-foreground">{pkg.sort_order}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[10rem]">
                      <p className="font-semibold">{pkg.name_en}</p>
                      <p className="text-xs text-muted-foreground">{pkg.name_ar}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-[10rem] flex-wrap gap-1">
                      {(pkg.occasion_types || []).slice(0, 3).map((o) => (
                        <Badge key={o} variant="secondary" className="text-[10px]">
                          {o}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {pkg.min_guests ?? '—'}–{pkg.max_guests ?? '—'}
                  </TableCell>
                  <TableCell className="tabular-nums">{Number(pkg.price_omr).toFixed(0)} OMR</TableCell>
                  <TableCell>
                    <Badge variant={pkg.status === 'published' ? 'default' : 'outline'}>
                      {STATUS_LABEL[pkg.status] || pkg.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button type="button" title="Most Popular" onClick={() => patch(pkg.id, { is_popular: !pkg.is_popular })}>
                        <Star className={`size-4 ${pkg.is_popular ? 'fill-brand-sand text-brand-sand' : 'text-muted-foreground'}`} />
                      </button>
                      <button type="button" title="Recommended" onClick={() => patch(pkg.id, { is_recommended: !pkg.is_recommended })}>
                        <Sparkles className={`size-4 ${pkg.is_recommended ? 'text-brand-palm' : 'text-muted-foreground'}`} />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>V {pkg.views_count}</div>
                    <div>C {pkg.customizations_count}</div>
                    <div>R {pkg.requests_count}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {pkg.updated_at ? new Date(pkg.updated_at).toLocaleDateString('ar') : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/packages/${pkg.id}`} className="rounded p-1.5 hover:bg-secondary" title="Edit">
                        <Pencil className="size-4" />
                      </Link>
                      <Link
                        href={`/packages/${pkg.slug}?preview=1`}
                        target="_blank"
                        className="rounded p-1.5 hover:bg-secondary"
                        title="Preview"
                      >
                        <Eye className="size-4" />
                      </Link>
                      <button type="button" className="rounded p-1.5 hover:bg-secondary" title="Duplicate" onClick={() => duplicate(pkg.id)}>
                        <Copy className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1.5 hover:bg-secondary"
                        title="Archive"
                        onClick={() => patch(pkg.id, { status: 'archived', is_active: false })}
                      >
                        <Archive className="size-4" />
                      </button>
                      <button type="button" className="rounded p-1.5 text-destructive hover:bg-secondary" title="Delete" onClick={() => remove(pkg.id)}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
