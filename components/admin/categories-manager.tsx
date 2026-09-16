'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { FolderTree, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { PackageCategory } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/components/language-provider'

export function CategoriesManager() {
  const { tx } = useLanguage()
  const [rows, setRows] = useState<PackageCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name_ar: '', name_en: '', slug: '' })

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/package-categories')
    if (res.ok) {
      const data = (await res.json()) as PackageCategory[]
      setRows(data.filter((r) => r.is_active !== false))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    if (!form.name_ar.trim() || !form.name_en.trim()) {
      toast.error(tx('الاسم مطلوب', 'Name required'))
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/package-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        toast.error(tx('تعذر الحفظ', 'Could not save'))
        return
      }
      toast.success(
        tx(
          'تمت إضافة التصنيف — سيظهر في فلاتر الموقع تلقائيًا',
          'Category added — it will appear in site filters',
        ),
      )
      setForm({ name_ar: '', name_en: '', slug: '' })
      await load()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm(tx('حذف التصنيف؟', 'Delete this category?'))) return
    const res = await fetch(`/api/admin/package-categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(tx('تم الحذف', 'Deleted'))
      load()
    } else {
      toast.error(tx('تعذر الحذف', 'Could not delete'))
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
    <div className="@container space-y-4 sm:space-y-6">
      <div className="rounded-2xl bg-brand-palm/6 p-4 ring-1 ring-brand-palm/10 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-palm text-brand-cream">
                <FolderTree className="size-4" />
              </span>
              <span className="rounded-full bg-brand-sand/40 px-2.5 py-0.5 text-xs font-semibold text-brand-palm">
                {rows.length} {tx('تصنيف', 'categories')}
              </span>
            </div>
            <h1 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">
              {tx('تصنيفات / مناسبات الباقات', 'Package categories / occasions')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tx(
                'ديناميكية — أي تصنيف جديد يظهر في فلاتر الواجهة.',
                'Dynamic — new categories appear in site filters.',
              )}
            </p>
          </div>
          <Button
            render={<Link href="/admin/packages" />}
            nativeButton={false}
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
          >
            {tx('الباقات', 'Packages')}
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/8 sm:p-5">
        <h2 className="font-bold">{tx('إضافة تصنيف', 'Add category')}</h2>
        <div className="grid gap-3 @2xl:grid-cols-4">
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
            <Label className="font-en">Slug</Label>
            <Input
              className="ltr-data mt-1.5 h-11"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="conference"
            />
          </div>
          <div className="flex items-end">
            <Button className="min-h-11 w-full gap-1.5" disabled={saving} onClick={create}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {tx('إضافة', 'Add')}
            </Button>
          </div>
        </div>
      </div>

      <ul className="grid gap-2 @3xl:grid-cols-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/8"
          >
            <div className="min-w-0">
              <p className="font-ar truncate font-semibold">{r.name_ar}</p>
              <p className="font-en truncate text-xs text-muted-foreground">
                {r.name_en} · <span className="ltr-data">{r.slug}</span>
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-rose-700"
              onClick={() => remove(r.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
