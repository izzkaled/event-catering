'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Star, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import type { Package } from '@/lib/db/schema'
import { PriceCell } from '@/components/admin/price-cell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function PackagesPanel() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    hours_per_visit: 2,
    visits_per_week: 2,
    price_omr: '',
  })

  const fetchPackages = useCallback(async () => {
    const res = await fetch('/api/admin/packages')
    if (res.ok) setPackages(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const patch = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/packages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setPackages((prev) => prev.map((p) => (p.id === id ? updated : p)))
    } else {
      toast.error('فشل التحديث')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return
    const res = await fetch(`/api/admin/packages/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPackages((prev) => prev.filter((p) => p.id !== id))
      toast.success('تم الحذف')
    }
  }

  const addPackage = async () => {
    const visits_per_month = form.visits_per_week * 4
    const res = await fetch('/api/admin/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        visits_per_month,
        sort_order: packages.length + 1,
      }),
    })
    if (res.ok) {
      const pkg = await res.json()
      setPackages((prev) => [...prev, pkg])
      setShowForm(false)
      setForm({ name_ar: '', name_en: '', hours_per_visit: 2, visits_per_week: 2, price_omr: '' })
      toast.success('تمت الإضافة')
    }
  }

  const moveOrder = async (pkg: Package, direction: 'up' | 'down') => {
    const idx = packages.findIndex((p) => p.id === pkg.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= packages.length) return
    const other = packages[swapIdx]
    await Promise.all([
      patch(pkg.id, { sort_order: other.sort_order }),
      patch(other.id, { sort_order: pkg.sort_order }),
    ])
    fetchPackages()
  }

  if (loading) return <p className="text-muted-foreground">جاري التحميل...</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">إدارة الباقات</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" />
          إضافة باقة جديدة
        </Button>
      </div>

      {showForm && (
        <div className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label>الاسم (عربي)</Label>
            <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>الاسم (English)</Label>
            <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>الساعات</Label>
            <Input type="number" value={form.hours_per_visit} onChange={(e) => setForm({ ...form, hours_per_visit: +e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>زيارات/أسبوع</Label>
            <Input type="number" value={form.visits_per_week} onChange={(e) => setForm({ ...form, visits_per_week: +e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>السعر (OMR)</Label>
            <Input value={form.price_omr} onChange={(e) => setForm({ ...form, price_omr: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button onClick={addPackage} className="w-full">حفظ</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الترتيب</TableHead>
              <TableHead>الباقة</TableHead>
              <TableHead>ساعات</TableHead>
              <TableHead>زيارات</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg, idx) => (
              <TableRow key={pkg.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveOrder(pkg, 'up')} disabled={idx === 0}>
                      <ChevronUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => moveOrder(pkg, 'down')} disabled={idx === packages.length - 1}>
                      <ChevronDown className="size-4" />
                    </button>
                    {pkg.sort_order}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {pkg.name_ar}
                    {pkg.is_featured && <Badge variant="secondary">⭐</Badge>}
                  </div>
                </TableCell>
                <TableCell>{pkg.hours_per_visit}</TableCell>
                <TableCell>{pkg.visits_per_week}/أسبوع</TableCell>
                <TableCell>
                  <PriceCell value={pkg.price_omr} onSave={(price) => patch(pkg.id, { price_omr: price })} />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => patch(pkg.id, { is_active: !pkg.is_active })}
                    className={pkg.is_active ? 'text-primary' : 'text-muted-foreground'}
                  >
                    {pkg.is_active ? '✅ فعال' : '❌ معطل'}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => patch(pkg.id, { is_featured: !pkg.is_featured })} title="تمييز">
                      <Star className={`size-4 ${pkg.is_featured ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <button type="button" onClick={() => remove(pkg.id)} className="text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
