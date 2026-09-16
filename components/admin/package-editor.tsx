'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Eye,
  Loader2,
  Package,
  Save,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import type { HospitalityService, PackageCategory } from '@/lib/db/schema'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'

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

const fieldClass = 'mt-1.5'
const selectClass =
  'mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
const sectionClass =
  'space-y-4 rounded-2xl bg-card p-4 shadow-none ring-1 ring-foreground/8 sm:p-5'

function SectionTitle({
  title,
  hint,
}: {
  title: string
  hint?: string
}) {
  return (
    <div className="border-b border-foreground/6 pb-3">
      <h2 className="text-base font-bold sm:text-lg">{title}</h2>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{hint}</p> : null}
    </div>
  )
}

export function PackageEditor({ packageId }: { packageId?: string }) {
  const router = useRouter()
  const { tx, lang } = useLanguage()
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
          toast.error(tx('الباقة غير موجودة', 'Package not found'))
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
          services: (pkg.services || []).map(
            (l: { service: { id: string }; role: string; custom_price_omr: string | null }) => ({
              service_id: l.service.id,
              role: l.role as ServiceLink['role'],
              custom_price_omr: l.custom_price_omr != null ? String(l.custom_price_omr) : '',
            }),
          ),
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
      features_ar: form.features_ar
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      features_en: form.features_en
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
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
        toast.error(data.error || tx('فشل الحفظ', 'Save failed'))
        return
      }
      toast.success(publish ? tx('تم النشر', 'Published') : tx('تم الحفظ', 'Saved'))
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

  const statusMeta: Record<string, { ar: string; en: string; className: string }> = {
    draft: { ar: 'مسودة', en: 'Draft', className: 'bg-amber-100 text-amber-900' },
    published: { ar: 'منشورة', en: 'Published', className: 'bg-emerald-100 text-emerald-900' },
    hidden: { ar: 'مخفية', en: 'Hidden', className: 'bg-slate-200 text-slate-800' },
    archived: { ar: 'مؤرشفة', en: 'Archived', className: 'bg-rose-100 text-rose-900' },
  }
  const status = statusMeta[form.status] || statusMeta.draft

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        {tx('جاري التحميل...', 'Loading...')}
      </div>
    )
  }

  const actionButtons = (
    <>
      <Button
        render={<Link href="/admin/packages" />}
        nativeButton={false}
        variant="ghost"
        className="hidden sm:inline-flex"
      >
        <ArrowRight className="size-4 rtl:rotate-180" />
        {tx('رجوع', 'Back')}
      </Button>
      {form.slug ? (
        <Button
          render={<Link href={`/packages/${form.slug}?preview=1`} target="_blank" />}
          nativeButton={false}
          variant="outline"
          className="min-h-11 flex-1 sm:flex-none"
        >
          <Eye className="size-4" />
          {tx('معاينة', 'Preview')}
        </Button>
      ) : null}
      <Button
        variant="outline"
        disabled={saving}
        onClick={() => save(false)}
        className="min-h-11 flex-1 sm:flex-none"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {tx('حفظ مسودة', 'Save draft')}
      </Button>
      <Button disabled={saving} onClick={() => save(true)} className="min-h-11 flex-1 sm:flex-none">
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {tx('نشر الباقة', 'Publish')}
      </Button>
    </>
  )

  return (
    <div className="@container mx-auto max-w-4xl space-y-4 pb-28 sm:space-y-6 sm:pb-8">
      <div className="rounded-2xl bg-brand-palm/6 p-4 ring-1 ring-brand-palm/10 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-palm text-brand-cream">
                <Package className="size-4" />
              </span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', status.className)}>
                {lang === 'ar' ? status.ar : status.en}
              </span>
            </div>
            <h1 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">
              {packageId ? tx('تعديل الباقة', 'Edit package') : tx('باقة جديدة', 'New package')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tx(
                'الحقول تظهر مباشرة في واجهة العميل بعد النشر.',
                'Fields appear on the customer site after publish.',
              )}
            </p>
            {(form.name_ar || form.name_en) && (
              <p className="mt-2 truncate text-sm font-medium text-brand-palm">
                <span className="font-ar">{form.name_ar || '—'}</span>
                <span className="mx-1.5 text-muted-foreground">·</span>
                <span className="font-en">{form.name_en || '—'}</span>
              </p>
            )}
          </div>
          <div className="hidden flex-wrap justify-end gap-2 sm:flex">{actionButtons}</div>
        </div>
      </div>

      <section className={sectionClass}>
        <SectionTitle
          title={tx('البيانات الأساسية', 'Basic information')}
          hint={tx('الاسم والوصف بالعربي والإنجليزي', 'Name and description in AR / EN')}
        />
        <div className="grid gap-4 @2xl:grid-cols-2">
          <div>
            <Label className="font-ar">{tx('اسم الباقة (عربي)', 'Package name (AR)')}</Label>
            <Input
              className={cn(fieldClass, 'input-ar h-11')}
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
            />
          </div>
          <div>
            <Label className="font-en">{tx('اسم الباقة (إنجليزي)', 'Package name (EN)')}</Label>
            <Input
              className={cn(fieldClass, 'input-en h-11')}
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
            />
          </div>
          <div className="@2xl:col-span-2">
            <Label className="font-en">Slug</Label>
            <Input
              className={cn(fieldClass, 'ltr-data h-11')}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="signature-experience"
            />
          </div>
          <div>
            <Label className="font-ar">{tx('وصف قصير (عربي)', 'Short description (AR)')}</Label>
            <Textarea
              className={cn(fieldClass, 'input-ar min-h-24')}
              value={form.short_description_ar}
              onChange={(e) => setForm({ ...form, short_description_ar: e.target.value })}
            />
          </div>
          <div>
            <Label className="font-en">{tx('وصف قصير (إنجليزي)', 'Short description (EN)')}</Label>
            <Textarea
              className={cn(fieldClass, 'input-en min-h-24')}
              value={form.short_description_en}
              onChange={(e) => setForm({ ...form, short_description_en: e.target.value })}
            />
          </div>
          <div>
            <Label className="font-ar">{tx('الوصف الكامل (عربي)', 'Full description (AR)')}</Label>
            <Textarea
              className={cn(fieldClass, 'input-ar min-h-32')}
              value={form.description_ar}
              onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
            />
          </div>
          <div>
            <Label className="font-en">{tx('الوصف الكامل (إنجليزي)', 'Full description (EN)')}</Label>
            <Textarea
              className={cn(fieldClass, 'input-en min-h-32')}
              value={form.description_en}
              onChange={(e) => setForm({ ...form, description_en: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <SectionTitle
          title={tx('التصنيف / المناسبة', 'Category / occasion')}
          hint={tx('يمكن اختيار أكثر من مناسبة', 'You can select multiple occasions')}
        />
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tx('لا توجد تصنيفات', 'No categories yet')}</p>
          ) : (
            categories.map((c) => {
              const active = form.occasion_types.includes(c.slug)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleOccasion(c.slug)}
                  className={cn(
                    'min-h-10 rounded-full border px-3.5 py-2 text-sm transition',
                    active
                      ? 'border-brand-palm bg-brand-palm text-brand-cream'
                      : 'border-border bg-background hover:bg-muted/60',
                  )}
                >
                  <span className="font-ar">{c.name_ar}</span>
                  <span className="mx-1 opacity-50">·</span>
                  <span className="font-en text-xs opacity-90">{c.name_en}</span>
                </button>
              )
            })
          )}
        </div>
      </section>

      <section className={sectionClass}>
        <SectionTitle title={tx('التسعير والضيوف', 'Pricing & guests')} />
        <div className="grid gap-4 @xl:grid-cols-2 @3xl:grid-cols-3">
          <div>
            <Label>{tx('نموذج التسعير', 'Pricing model')}</Label>
            <select
              className={selectClass}
              value={form.pricing_model}
              onChange={(e) => setForm({ ...form, pricing_model: e.target.value })}
            >
              <option value="fixed">{tx('سعر ثابت', 'Fixed price')}</option>
              <option value="per_guest">{tx('لكل ضيف', 'Per guest')}</option>
              <option value="starting_from">{tx('يبدأ من', 'Starting from')}</option>
              <option value="custom_quote">{tx('عرض سعر مخصص', 'Custom quote')}</option>
            </select>
          </div>
          <div>
            <Label>{tx('السعر الأساسي (ر.ع)', 'Base / starting price (OMR)')}</Label>
            <Input
              className={cn(fieldClass, 'ltr-data h-11')}
              value={form.price_omr}
              onChange={(e) => setForm({ ...form, price_omr: e.target.value })}
            />
          </div>
          <div>
            <Label>{tx('لكل ضيف (ر.ع)', 'Per guest (OMR)')}</Label>
            <Input
              className={cn(fieldClass, 'ltr-data h-11')}
              value={form.per_guest_omr}
              onChange={(e) => setForm({ ...form, per_guest_omr: e.target.value })}
            />
          </div>
          <div>
            <Label>{tx('الحد الأدنى للضيوف', 'Minimum guests')}</Label>
            <Input
              className={cn(fieldClass, 'ltr-data h-11')}
              type="number"
              value={form.min_guests}
              onChange={(e) => setForm({ ...form, min_guests: e.target.value })}
            />
          </div>
          <div>
            <Label>{tx('الحد الأقصى للضيوف', 'Maximum guests')}</Label>
            <Input
              className={cn(fieldClass, 'ltr-data h-11')}
              type="number"
              value={form.max_guests}
              onChange={(e) => setForm({ ...form, max_guests: e.target.value })}
            />
          </div>
          <div>
            <Label>{tx('ساعات الخدمة', 'Service hours')}</Label>
            <Input
              className={cn(fieldClass, 'ltr-data h-11')}
              type="number"
              value={form.hours_per_visit}
              onChange={(e) => setForm({ ...form, hours_per_visit: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <SectionTitle
          title={tx('محتوى الباقة', 'Package content')}
          hint={tx('من مكتبة الخدمات', 'From the services library')}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            className={cn(selectClass, 'mt-0 min-w-0 flex-1 sm:min-w-[16rem]')}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) addService(e.target.value)
              e.target.value = ''
            }}
          >
            <option value="">{tx('إضافة خدمة…', 'Add service…')}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {lang === 'ar' ? s.name_ar : s.name_en} ({s.category}) — {s.price_omr} OMR
                {s.pricing_model === 'per_guest'
                  ? lang === 'ar'
                    ? ' / ضيف'
                    : ' / guest'
                  : ''}
              </option>
            ))}
          </select>
          <Button
            render={<Link href="/admin/services" />}
            nativeButton={false}
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
          >
            {tx('مكتبة الخدمات', 'Manage services')}
          </Button>
        </div>
        <div className="space-y-2">
          {form.services.length === 0 ? (
            <p className="rounded-xl bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">
              {tx('لم تُضف خدمات بعد', 'No services added yet')}
            </p>
          ) : (
            form.services.map((link, idx) => {
              const svc = services.find((s) => s.id === link.service_id)
              return (
                <div
                  key={link.service_id}
                  className="flex flex-col gap-3 rounded-xl bg-muted/30 p-3 ring-1 ring-foreground/6 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-ar font-medium">{svc?.name_ar || link.service_id}</p>
                    <p className="font-en text-xs text-muted-foreground">
                      {svc?.name_en} ·{' '}
                      <span className="ltr-data">
                        {svc?.price_omr} OMR
                        {svc?.pricing_model === 'per_guest'
                          ? lang === 'ar'
                            ? ' / ضيف'
                            : ' / guest'
                          : ''}
                      </span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                    <select
                      className="h-10 rounded-lg border border-input bg-background px-2 text-sm"
                      value={link.role}
                      onChange={(e) => {
                        const role = e.target.value as ServiceLink['role']
                        setForm((f) => ({
                          ...f,
                          services: f.services.map((s, i) => (i === idx ? { ...s, role } : s)),
                        }))
                      }}
                    >
                      <option value="included">{tx('مضمّنة', 'Included')}</option>
                      <option value="optional">{tx('اختيارية', 'Optional')}</option>
                      <option value="addon">{tx('إضافة', 'Add-on')}</option>
                      <option value="recommended">{tx('موصى بها', 'Recommended')}</option>
                    </select>
                    <Input
                      className="ltr-data h-10"
                      placeholder={tx('سعر مخصص', 'Custom OMR')}
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
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="self-end text-rose-700 sm:self-auto"
                    onClick={() =>
                      setForm((f) => ({ ...f, services: f.services.filter((_, i) => i !== idx) }))
                    }
                  >
                    {tx('إزالة', 'Remove')}
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className={sectionClass}>
        <SectionTitle title={tx('المميزات والصورة', 'Features & cover')} />
        <div className="grid gap-4 @2xl:grid-cols-2">
          <div>
            <Label className="font-ar">{tx('المميزات عربي (سطر لكل عنصر)', 'Features AR (one per line)')}</Label>
            <Textarea
              className={cn(fieldClass, 'input-ar min-h-28')}
              value={form.features_ar}
              onChange={(e) => setForm({ ...form, features_ar: e.target.value })}
            />
          </div>
          <div>
            <Label className="font-en">{tx('المميزات إنجليزي (سطر لكل عنصر)', 'Features EN (one per line)')}</Label>
            <Textarea
              className={cn(fieldClass, 'input-en min-h-28')}
              value={form.features_en}
              onChange={(e) => setForm({ ...form, features_en: e.target.value })}
            />
          </div>
          <div className="@2xl:col-span-2">
            <ImageUploadField
              kind="package_cover"
              label={tx('صورة الغلاف', 'Cover image')}
              value={form.cover_image}
              onChange={(url) => setForm({ ...form, cover_image: url || '/images/brand/brand-table.webp' })}
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <SectionTitle title={tx('الظهور والشارات', 'Visibility & badges')} />
        <div className="grid gap-4 @xl:grid-cols-2">
          <div>
            <Label>{tx('الحالة', 'Status')}</Label>
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">{tx('مسودة', 'Draft')}</option>
              <option value="published">{tx('منشورة', 'Published')}</option>
              <option value="hidden">{tx('مخفية', 'Hidden')}</option>
              <option value="archived">{tx('مؤرشفة', 'Archived')}</option>
            </select>
          </div>
          <div>
            <Label>{tx('ترتيب العرض', 'Sort order')}</Label>
            <Input
              className={cn(fieldClass, 'ltr-data h-11')}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(
            [
              ['is_popular', tx('الأكثر طلباً / مميزة', 'Most popular / featured')],
              ['is_recommended', tx('موصى بها', 'Recommended')],
              ['is_new', tx('جديدة', 'New')],
              ['is_best_value', tx('أفضل قيمة', 'Best value')],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className={cn(
                'flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm ring-1 transition',
                form[key]
                  ? 'bg-brand-palm/8 ring-brand-palm/25'
                  : 'bg-background ring-foreground/8 hover:bg-muted/40',
              )}
            >
              <input
                type="checkbox"
                className="size-4 accent-brand-palm"
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              <span className="font-medium">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Mobile sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-4xl gap-2">{actionButtons}</div>
      </div>
    </div>
  )
}
