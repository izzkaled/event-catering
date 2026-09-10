'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { HospitalityService, PackageCategory } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type ServiceLink = {
  service_id: string
  role: 'included' | 'optional' | 'addon' | 'recommended'
  custom_price_omr: string
}

type FormState = {
  name_ar: string
  name_en: string
  slug: string
  short_description_ar: string
  short_description_en: string
  description_ar: string
  description_en: string
  occasion_types: string[]
  pricing_model: string
  price_omr: string
  per_guest_omr: string
  min_guests: string
  max_guests: string
  hours_per_visit: string
  cover_image: string
  features_ar: string
  features_en: string
  status: string
  is_popular: boolean
  is_recommended: boolean
  is_new: boolean
  is_best_value: boolean
  sort_order: string
  services: ServiceLink[]
}

const emptyForm = (): FormState => ({
  name_ar: '',
  name_en: '',
  slug: '',
  short_description_ar: '',
  short_description_en: '',
  description_ar: '',
  description_en: '',
  occasion_types: [],
  pricing_model: 'starting_from',
  price_omr: '',
  per_guest_omr: '',
  min_guests: '25',
  max_guests: '100',
  hours_per_visit: '4',
  cover_image: '/images/brand/brand-table.webp',
  features_ar: '',
  features_en: '',
  status: 'draft',
  is_popular: false,
  is_recommended: false,
  is_new: false,
  is_best_value: false,
  sort_order: '0',
  services: [],
})

export function PackageEditor({ packageId }: { packageId?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [services, setServices] = useState<HospitalityService[]>([])
  const [categories, setCategories] = useState<PackageCategory[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(Boolean(packageId))

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/services').then((r) => r.json()),
      fetch('/api/admin/package-categories').then((r) => r.json()),
    ]).then(([svc, cats]) => {
      setServices(Array.isArray(svc) ? svc.filter((s: HospitalityService) => !s.is_archived) : [])
      setCategories(Array.isArray(cats) ? cats.filter((c: PackageCategory) => c.is_active) : [])
    })
  }, [])

  useEffect(() => {
    if (!packageId) return
    fetch(`/api/admin/packages/${packageId}`)
      .then((r) => r.json())
      .then((pkg) => {
        if (pkg.error) {
          toast.error('الباقة غير موجودة')
          return
        }
        setForm({
          name_ar: pkg.name_ar || '',
          name_en: pkg.name_en || '',
          slug: pkg.slug || '',
          short_description_ar: pkg.short_description_ar || '',
          short_description_en: pkg.short_description_en || '',
          description_ar: pkg.description_ar || '',
          description_en: pkg.description_en || '',
          occasion_types: pkg.occasion_types || [],
          pricing_model: pkg.pricing_model || 'starting_from',
          price_omr: String(pkg.price_omr ?? ''),
          per_guest_omr: pkg.per_guest_omr != null ? String(pkg.per_guest_omr) : '',
          min_guests: String(pkg.min_guests ?? pkg.visits_per_week ?? 25),
          max_guests: String(pkg.max_guests ?? pkg.visits_per_week ?? 100),
          hours_per_visit: String(pkg.hours_per_visit ?? 4),
          cover_image: pkg.cover_image || '',
          features_ar: (pkg.features_ar || []).join('\n'),
          features_en: (pkg.features_en || []).join('\n'),
          status: pkg.status || 'draft',
          is_popular: Boolean(pkg.is_popular),
          is_recommended: Boolean(pkg.is_recommended),
          is_new: Boolean(pkg.is_new),
          is_best_value: Boolean(pkg.is_best_value),
          sort_order: String(pkg.sort_order ?? 0),
          services: (pkg.services || []).map((l: { service: { id: string }; role: string; custom_price_omr: string | null }) => ({
            service_id: l.service.id,
            role: l.role as ServiceLink['role'],
            custom_price_omr: l.custom_price_omr != null ? String(l.custom_price_omr) : '',
          })),
        })
      })
      .finally(() => setLoading(false))
  }, [packageId])

  const payload = useMemo(() => {
    const min = Number(form.min_guests) || 1
    const max = Number(form.max_guests) || min
    const typical = Math.round((min + max) / 2)
    return {
      name_ar: form.name_ar,
      name_en: form.name_en,
      slug: form.slug,
      short_description_ar: form.short_description_ar,
      short_description_en: form.short_description_en,
      description_ar: form.description_ar,
      description_en: form.description_en,
      occasion_types: form.occasion_types,
      pricing_model: form.pricing_model,
      price_omr: form.price_omr,
      per_guest_omr: form.per_guest_omr || null,
      min_guests: min,
      max_guests: max,
      visits_per_week: typical,
      hours_per_visit: Number(form.hours_per_visit) || 4,
      cover_image: form.cover_image,
      features_ar: form.features_ar.split('\n').map((s) => s.trim()).filter(Boolean),
      features_en: form.features_en.split('\n').map((s) => s.trim()).filter(Boolean),
      status: form.status,
      is_popular: form.is_popular,
      is_recommended: form.is_recommended,
      is_new: form.is_new,
      is_best_value: form.is_best_value,
      sort_order: Number(form.sort_order) || 0,
      services: form.services.map((s) => ({
        service_id: s.service_id,
        role: s.role,
        custom_price_omr: s.custom_price_omr === '' ? null : s.custom_price_omr,
      })),
    }
  }, [form])

  const save = async (publish?: boolean) => {
    setSaving(true)
    const body = { ...payload, status: publish ? 'published' : form.status }
    try {
      const res = await fetch(packageId ? `/api/admin/packages/${packageId}` : '/api/admin/packages', {
        method: packageId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'فشل الحفظ')
        return
      }
      toast.success(publish ? 'تم النشر' : 'تم الحفظ')
      if (!packageId && data.id) router.replace(`/admin/packages/${data.id}`)
      else if (publish) setForm((f) => ({ ...f, status: 'published' }))
    } finally {
      setSaving(false)
    }
  }

  const toggleOccasion = (slug: string) => {
    setForm((f) => ({
      ...f,
      occasion_types: f.occasion_types.includes(slug)
        ? f.occasion_types.filter((x) => x !== slug)
        : [...f.occasion_types, slug],
    }))
  }

  const addService = (serviceId: string) => {
    if (form.services.some((s) => s.service_id === serviceId)) return
    setForm((f) => ({
      ...f,
      services: [...f.services, { service_id: serviceId, role: 'included', custom_price_omr: '' }],
    }))
  }

  if (loading) return <p className="text-muted-foreground">جاري التحميل...</p>

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{packageId ? 'تعديل الباقة' : 'Create New Package'}</h1>
          <p className="text-sm text-muted-foreground">الحقول تظهر مباشرة في واجهة العميل بعد النشر.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/admin/packages" />} nativeButton={false} variant="ghost">
            رجوع
          </Button>
          {form.slug && (
            <Button
              render={<Link href={`/packages/${form.slug}?preview=1`} target="_blank" />}
              nativeButton={false}
              variant="outline"
            >
              Preview
            </Button>
          )}
          <Button variant="outline" disabled={saving} onClick={() => save(false)}>
            Save Draft
          </Button>
          <Button disabled={saving} onClick={() => save(true)}>
            Publish Package
          </Button>
        </div>
      </div>

      <section className="space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-semibold">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Package Name (EN)</Label>
            <Input className="mt-1" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          </div>
          <div>
            <Label>اسم الباقة (AR)</Label>
            <Input className="mt-1" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Package Slug</Label>
            <Input className="mt-1" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="signature-experience" />
          </div>
          <div>
            <Label>Short Description EN</Label>
            <Textarea className="mt-1" value={form.short_description_en} onChange={(e) => setForm({ ...form, short_description_en: e.target.value })} />
          </div>
          <div>
            <Label>وصف قصير AR</Label>
            <Textarea className="mt-1" value={form.short_description_ar} onChange={(e) => setForm({ ...form, short_description_ar: e.target.value })} />
          </div>
          <div>
            <Label>Full Description EN</Label>
            <Textarea className="mt-1 min-h-28" value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
          </div>
          <div>
            <Label>الوصف الكامل AR</Label>
            <Textarea className="mt-1 min-h-28" value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-semibold">Category / Occasion (متعدد)</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleOccasion(c.slug)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm',
                form.occasion_types.includes(c.slug)
                  ? 'border-brand-palm bg-brand-palm text-brand-cream'
                  : 'border-border',
              )}
            >
              {c.name_en} · {c.name_ar}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-semibold">Pricing & Guests</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Pricing Model</Label>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={form.pricing_model}
              onChange={(e) => setForm({ ...form, pricing_model: e.target.value })}
            >
              <option value="fixed">Fixed Price</option>
              <option value="per_guest">Per Guest</option>
              <option value="starting_from">Starting From</option>
              <option value="custom_quote">Custom Quote</option>
            </select>
          </div>
          <div>
            <Label>Base / Starting Price (OMR)</Label>
            <Input className="mt-1" value={form.price_omr} onChange={(e) => setForm({ ...form, price_omr: e.target.value })} />
          </div>
          <div>
            <Label>Per Guest (OMR)</Label>
            <Input className="mt-1" value={form.per_guest_omr} onChange={(e) => setForm({ ...form, per_guest_omr: e.target.value })} />
          </div>
          <div>
            <Label>Minimum Guests</Label>
            <Input className="mt-1" type="number" value={form.min_guests} onChange={(e) => setForm({ ...form, min_guests: e.target.value })} />
          </div>
          <div>
            <Label>Maximum Guests</Label>
            <Input className="mt-1" type="number" value={form.max_guests} onChange={(e) => setForm({ ...form, max_guests: e.target.value })} />
          </div>
          <div>
            <Label>Service Hours</Label>
            <Input className="mt-1" type="number" value={form.hours_per_visit} onChange={(e) => setForm({ ...form, hours_per_visit: e.target.value })} />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-semibold">Package Content — من مكتبة الخدمات</h2>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-10 min-w-[16rem] rounded-lg border border-input bg-background px-3 text-sm"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) addService(e.target.value)
              e.target.value = ''
            }}
          >
            <option value="">Add Service…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name_en} ({s.category}) — {s.price_omr} OMR
              </option>
            ))}
          </select>
          <Button render={<Link href="/admin/services" />} nativeButton={false} variant="outline" size="sm">
            Manage Services Library
          </Button>
        </div>
        <div className="space-y-2">
          {form.services.map((link, idx) => {
            const svc = services.find((s) => s.id === link.service_id)
            return (
              <div key={link.service_id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{svc?.name_en || link.service_id}</p>
                  <p className="text-xs text-muted-foreground">{svc?.name_ar} · default {svc?.price_omr} OMR</p>
                </div>
                <select
                  className="h-9 rounded border border-input bg-background px-2 text-sm"
                  value={link.role}
                  onChange={(e) => {
                    const role = e.target.value as ServiceLink['role']
                    setForm((f) => ({
                      ...f,
                      services: f.services.map((s, i) => (i === idx ? { ...s, role } : s)),
                    }))
                  }}
                >
                  <option value="included">Included</option>
                  <option value="optional">Optional</option>
                  <option value="addon">Add-on</option>
                  <option value="recommended">Recommended Add-on</option>
                </select>
                <Input
                  className="h-9 w-28"
                  placeholder="Custom $"
                  value={link.custom_price_omr}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      services: f.services.map((s, i) =>
                        i === idx ? { ...s, custom_price_omr: e.target.value } : s,
                      ),
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({ ...f, services: f.services.filter((_, i) => i !== idx) }))
                  }
                >
                  Remove
                </Button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-semibold">Features list (optional bullets)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Features EN (one per line)</Label>
            <Textarea className="mt-1 min-h-24" value={form.features_en} onChange={(e) => setForm({ ...form, features_en: e.target.value })} />
          </div>
          <div>
            <Label>المميزات AR (سطر لكل عنصر)</Label>
            <Textarea className="mt-1 min-h-24" value={form.features_ar} onChange={(e) => setForm({ ...form, features_ar: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Cover Image URL</Label>
          <Input className="mt-1" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-semibold">Visibility & Badges</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Status</Label>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <Label>Sort Order</Label>
            <Input className="mt-1" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_popular} onChange={(e) => setForm({ ...form, is_popular: e.target.checked })} />
            Most Popular / Featured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_recommended} onChange={(e) => setForm({ ...form, is_recommended: e.target.checked })} />
            Recommended
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} />
            New
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_best_value} onChange={(e) => setForm({ ...form, is_best_value: e.target.checked })} />
            Best Value
          </label>
        </div>
      </section>
    </div>
  )
}
