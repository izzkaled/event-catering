'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { PackageCategory } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CategoriesManager() {
  const [rows, setRows] = useState<PackageCategory[]>([])
  const [form, setForm] = useState({ name_ar: '', name_en: '', slug: '' })

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/package-categories')
    if (res.ok) setRows(await res.json())
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    const res = await fetch('/api/admin/package-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      toast.error('فشل')
      return
    }
    toast.success('تمت إضافة التصنيف — سيظهر في فلاتر الموقع تلقائيًا')
    setForm({ name_ar: '', name_en: '', slug: '' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">تصنيفات / مناسبات الباقات</h1>
          <p className="text-sm text-muted-foreground">ديناميكية — أي تصنيف جديد يظهر في فلاتر الواجهة.</p>
        </div>
        <Button render={<Link href="/admin/packages" />} nativeButton={false} variant="outline">
          الباقات
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-4">
        <div>
          <Label>Name EN</Label>
          <Input className="mt-1" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        </div>
        <div>
          <Label>الاسم AR</Label>
          <Input className="mt-1" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input className="mt-1" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="conference" />
        </div>
        <div className="flex items-end">
          <Button className="w-full gap-1" onClick={create}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="font-medium">{r.name_en} · {r.name_ar}</p>
              <p className="text-xs text-muted-foreground">{r.slug}</p>
            </div>
            <span className="text-xs">{r.is_active ? 'Active' : 'Inactive'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
