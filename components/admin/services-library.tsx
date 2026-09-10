'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Archive } from 'lucide-react'
import { toast } from 'sonner'
import type { HospitalityService } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const CATS = [
  { id: 'food_beverage', label: 'Food & Beverage' },
  { id: 'setup', label: 'Setup' },
  { id: 'staff', label: 'Staff' },
  { id: 'additional', label: 'Additional' },
]

export function ServicesLibrary() {
  const [rows, setRows] = useState<HospitalityService[]>([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    category: 'food_beverage',
    price_omr: '',
    image_url: '',
  })

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/services')
    if (res.ok) setRows(await res.json())
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      toast.error('فشل الإنشاء')
      return
    }
    toast.success('تمت إضافة الخدمة')
    setShow(false)
    setForm({
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      category: 'food_beverage',
      price_omr: '',
      image_url: '',
    })
    load()
  }

  const archive = async (id: string) => {
    const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('تمت الأرشفة')
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
    else toast.error('فشل التحديث')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">مكتبة الخدمات</h1>
          <p className="text-sm text-muted-foreground">خدمات عامة تُعاد استخدامها عبر كل الباقات.</p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/admin/packages" />} nativeButton={false} variant="outline">
            الباقات
          </Button>
          <Button className="gap-1.5" onClick={() => setShow((v) => !v)}>
            <Plus className="size-4" />
            Create Service
          </Button>
        </div>
      </div>

      {show && (
        <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
          <div>
            <Label>Name EN</Label>
            <Input className="mt-1" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          </div>
          <div>
            <Label>الاسم AR</Label>
            <Input className="mt-1" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          </div>
          <div>
            <Label>Category</Label>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Price OMR</Label>
            <Input className="mt-1" value={form.price_omr} onChange={(e) => setForm({ ...form, price_omr: e.target.value })} />
          </div>
          <div>
            <Label>Description EN</Label>
            <Textarea className="mt-1" value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
          </div>
          <div>
            <Label>الوصف AR</Label>
            <Textarea className="mt-1" value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Image URL</Label>
            <Input className="mt-1" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <Button onClick={create}>Save Service</Button>
        </div>
      )}

      <div className="space-y-2">
        {rows.filter((r) => !r.is_archived).map((row) => (
          <div key={row.id} className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{row.name_en}</p>
              <p className="text-sm text-muted-foreground">{row.name_ar} · {row.category}</p>
            </div>
            <Input
              className="h-9 w-28"
              defaultValue={row.price_omr}
              onBlur={(e) => {
                if (e.target.value !== String(row.price_omr)) patch(row.id, { price_omr: e.target.value })
              }}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => archive(row.id)}>
              <Archive className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
