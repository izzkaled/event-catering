'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Star, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import type { Package, PackageSection } from '@/lib/db/schema'
import { visitsPerMonthFromWeekly } from '@/lib/booking/schedule'
import { isPackagePopular } from '@/lib/packages/types'
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
  const [sections, setSections] = useState<PackageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [sectionForm, setSectionForm] = useState({
    slug: '',
    name_ar: '',
    name_en: '',
  })
  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    hours_per_visit: 2,
    visits_per_week: 2,
    price_omr: '',
    section_id: '',
    is_popular: false,
  })

  const fetchAll = useCallback(async () => {
    const [pkgRes, secRes] = await Promise.all([
      fetch('/api/admin/packages'),
      fetch('/api/admin/package-sections'),
    ])
    if (pkgRes.ok) setPackages(await pkgRes.json())
    if (secRes.ok) setSections(await secRes.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

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

  const addSection = async () => {
    if (!sectionForm.name_ar.trim() || !sectionForm.name_en.trim()) {
      toast.error('أدخل الاسم بالعربي والإنجليزي')
      return
    }

    const res = await fetch('/api/admin/package-sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sectionForm),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setSections((prev) => [...prev, data])
      setShowSectionForm(false)
      setSectionForm({ slug: '', name_ar: '', name_en: '' })
      toast.success('تمت إضافة القسم')
    } else {
      toast.error(typeof data.error === 'string' ? data.error : 'فشل إضافة القسم')
    }
  }

  const weeklyPresets = [1, 2, 3, 4, 5] as const
  const monthlyPreview = visitsPerMonthFromWeekly(form.visits_per_week)

  const addPackage = async () => {
    if (form.visits_per_week < 1 || form.visits_per_week > 7) {
      toast.error('زيارات الأسبوع يجب أن تكون بين 1 و 7')
      return
    }
    const visits_per_month = visitsPerMonthFromWeekly(form.visits_per_week)
    const res = await fetch('/api/admin/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        section_id: form.section_id || null,
        visits_per_month,
        sort_order: packages.length + 1,
      }),
    })
    if (res.ok) {
      const pkg = await res.json()
      setPackages((prev) => [...prev, pkg])
      setShowForm(false)
      setForm({
        name_ar: '',
        name_en: '',
        hours_per_visit: 2,
        visits_per_week: 2,
        price_omr: '',
        section_id: sections[0]?.id ?? '',
        is_popular: false,
      })
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
    fetchAll()
  }

  if (loading) return <p className="text-muted-foreground">جاري التحميل...</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">أقسام الخدمات</h2>
          <Button variant="outline" size="sm" onClick={() => setShowSectionForm(!showSectionForm)}>
            <Plus className="size-4" />
            قسم جديد
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          نظّم الباقات حسب نوع الخدمة (تنظيف، غسيل، تعقيم…). يمكنك إضافة أقسام مستقبلية دون تغيير الكود.
        </p>
        {showSectionForm && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <Label>الاسم (عربي)</Label>
              <Input
                placeholder="غسيل"
                value={sectionForm.name_ar}
                onChange={(e) => setSectionForm({ ...sectionForm, name_ar: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>الاسم (English)</Label>
              <Input
                placeholder="Laundry"
                value={sectionForm.name_en}
                onChange={(e) => setSectionForm({ ...sectionForm, name_en: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>المعرّف (اختياري)</Label>
              <Input
                placeholder="laundry — يُنشأ تلقائياً من الاسم الإنجليزي"
                value={sectionForm.slug}
                onChange={(e) => setSectionForm({ ...sectionForm, slug: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="sm:col-span-3">
              <Button onClick={addSection}>حفظ القسم</Button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <Badge key={s.id} variant={s.is_active ? 'secondary' : 'outline'}>
              {s.name_ar}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">إدارة الباقات</h2>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            if (!form.section_id && sections[0]) {
              setForm((f) => ({ ...f, section_id: sections[0].id }))
            }
          }}
        >
          <Plus className="size-4" />
          إضافة باقة جديدة
        </Button>
      </div>

      {showForm && (
        <div className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
            <Label>القسم</Label>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={form.section_id}
              onChange={(e) => setForm({ ...form, section_id: e.target.value })}
            >
              <option value="">بدون قسم</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_ar}
                </option>
              ))}
            </select>
          </div>
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
            <Input
              type="number"
              value={form.hours_per_visit}
              onChange={(e) => setForm({ ...form, hours_per_visit: +e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>زيارات/أسبوع (أيام الزيارة)</Label>
            <div className="flex flex-wrap gap-2">
              {weeklyPresets.map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant={form.visits_per_week === n ? 'default' : 'outline'}
                  onClick={() => setForm({ ...form, visits_per_week: n })}
                >
                  {n} {n === 1 ? 'يوم' : 'أيام'}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              min={1}
              max={7}
              value={form.visits_per_week}
              onChange={(e) =>
                setForm({ ...form, visits_per_week: Math.min(7, Math.max(1, +e.target.value || 1)) })
              }
            />
            <p className="text-xs text-muted-foreground">
              الزيارات الشهرية تلقائياً: <strong>{monthlyPreview}</strong> (4 أسابيع ×{' '}
              {form.visits_per_week})
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>السعر (OMR)</Label>
            <Input value={form.price_omr} onChange={(e) => setForm({ ...form, price_omr: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="is_popular"
              type="checkbox"
              checked={form.is_popular}
              onChange={(e) => setForm({ ...form, is_popular: e.target.checked })}
            />
            <Label htmlFor="is_popular" className="cursor-pointer">
              الأكثر طلباً (شارة خضراء ⭐)
            </Label>
          </div>
          <div className="flex items-end">
            <Button onClick={addPackage} className="w-full">
              حفظ
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الترتيب</TableHead>
              <TableHead>القسم</TableHead>
              <TableHead>الباقة</TableHead>
              <TableHead>ساعات</TableHead>
              <TableHead>زيارات</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg, idx) => {
              const popular = isPackagePopular(pkg)
              return (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveOrder(pkg, 'up')} disabled={idx === 0}>
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOrder(pkg, 'down')}
                        disabled={idx === packages.length - 1}
                      >
                        <ChevronDown className="size-4" />
                      </button>
                      {pkg.sort_order}
                    </div>
                  </TableCell>
                  <TableCell>
                    <select
                      className="max-w-[120px] rounded border border-input bg-background px-1 py-0.5 text-xs"
                      value={pkg.section_id ?? ''}
                      onChange={(e) => patch(pkg.id, { section_id: e.target.value || null })}
                    >
                      <option value="">—</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name_ar}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {pkg.name_ar}
                      {popular && (
                        <Badge className="gap-0.5 border-emerald-400/40 bg-emerald-600 text-white hover:bg-emerald-600">
                          ⭐
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{pkg.hours_per_visit}</TableCell>
                  <TableCell>
                    {pkg.visits_per_week}/أسبوع
                    <div className="text-xs text-muted-foreground">{pkg.visits_per_month}/شهر</div>
                  </TableCell>
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
                      <button
                        type="button"
                        onClick={() => patch(pkg.id, { is_popular: !popular })}
                        title="الأكثر طلباً"
                      >
                        <Star
                          className={`size-4 ${popular ? 'fill-emerald-500 text-emerald-500' : 'text-muted-foreground'}`}
                        />
                      </button>
                      <button type="button" onClick={() => remove(pkg.id)} className="text-destructive">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
