'use client'

import { useState, type FormEvent } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TurnstileWidget, isTurnstileConfigured } from '@/components/cloudflare/turnstile-widget'
import { useLanguage } from '@/components/language-provider'
import {
  KITCHEN_TYPE_OPTIONS,
  MAX_SUPPLIER_PHOTOS,
  PREP_SPEED_OPTIONS,
} from '@/lib/suppliers/application-options'
import { IMAGE_SPECS } from '@/lib/uploads/image-specs'

const selectClass =
  'mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

type FormState = {
  company_name: string
  contact_phone: string
  prep_speed: string
  breakfast_price_omr: string
  lunch_price_omr: string
  dinner_price_omr: string
  instagram: string
  desserts_type: string
  min_order_qty: string
  min_order_price_omr: string
  kitchen_type: string
  notes: string
}

const empty: FormState = {
  company_name: '',
  contact_phone: '',
  prep_speed: 'hours_24',
  breakfast_price_omr: '',
  lunch_price_omr: '',
  dinner_price_omr: '',
  instagram: '',
  desserts_type: '',
  min_order_qty: '',
  min_order_price_omr: '',
  kitchen_type: 'omani',
  notes: '',
}

export function SupplierJoinForm() {
  const { lang, tx } = useLanguage()
  const [form, setForm] = useState<FormState>(empty)
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const onPickPhotos = (list: FileList | null) => {
    if (!list?.length) return
    const next = [...photos]
    const nextPrev = [...previews]
    for (const file of Array.from(list)) {
      if (next.length >= MAX_SUPPLIER_PHOTOS) break
      const invalidType = !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      if (invalidType) {
        toast.error(tx('الصيغة غير مدعومة — استخدم JPG أو PNG أو WebP', 'Use JPG, PNG, or WebP'))
        continue
      }
      if (file.size > IMAGE_SPECS.supplier_gallery.maxBytes) {
        toast.error(tx('حجم الصورة كبير', 'Image too large'))
        continue
      }
      next.push(file)
      nextPrev.push(URL.createObjectURL(file))
    }
    setPhotos(next)
    setPreviews(nextPrev)
  }

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]!)
    setPhotos((p) => p.filter((_, i) => i !== index))
    setPreviews((p) => p.filter((_, i) => i !== index))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.company_name.trim() || !form.contact_phone.trim()) {
      toast.error(tx('اسم الشركة ورقم التواصل مطلوبان', 'Company name and phone are required'))
      return
    }
    if (isTurnstileConfigured() && !turnstileToken) {
      toast.error(tx('أكمل التحقق الأمني', 'Complete the security check'))
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (turnstileToken) fd.append('turnstileToken', turnstileToken)
      photos.forEach((file) => fd.append('photos', file))

      const res = await fetch('/api/suppliers/apply', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(
          typeof data.error === 'string'
            ? data.error
            : tx('تعذر إرسال الطلب', 'Could not submit'),
        )
        return
      }
      setDone(true)
      toast.success(tx('تم إرسال طلب التسجيل', 'Application submitted'))
    } catch {
      toast.error(tx('تعذر إرسال الطلب', 'Could not submit'))
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-palm/25 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
        <h2 className="font-ios text-2xl font-semibold text-[var(--ink)]">
          {tx('وصلنا طلبكم', 'We received your application')}
        </h2>
        <p className="mt-3 text-[var(--ink-soft)]">
          {tx(
            'سيتم مراجعة بياناتكم وصور المناسبات، ونتواصل معكم على رقم التواصل المسجّل.',
            'We will review your details and event photos, then contact you on the phone you provided.',
          )}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-8 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--ink)]">
          {tx('بيانات الشركة', 'Company details')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="company_name">{tx('اسم الشركة', 'Company name')} *</Label>
            <Input
              id="company_name"
              className="mt-1.5 h-11"
              value={form.company_name}
              onChange={(e) => set({ company_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="contact_phone">{tx('رقم التواصل / واتساب', 'Phone / WhatsApp')} *</Label>
            <Input
              id="contact_phone"
              className="mt-1.5 h-11 ltr-data"
              inputMode="tel"
              placeholder="+968"
              value={form.contact_phone}
              onChange={(e) => set({ contact_phone: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="instagram">{tx('حساب إنستغرام', 'Instagram')} ({tx('اختياري', 'optional')})</Label>
            <Input
              id="instagram"
              className="mt-1.5 h-11 ltr-data"
              placeholder="@company"
              value={form.instagram}
              onChange={(e) => set({ instagram: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="prep_speed">{tx('سرعة تجهيز الطلب', 'Order prep speed')} *</Label>
            <select
              id="prep_speed"
              className={selectClass}
              value={form.prep_speed}
              onChange={(e) => set({ prep_speed: e.target.value })}
              required
            >
              {PREP_SPEED_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {lang === 'ar' ? o.ar : o.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="kitchen_type">{tx('نوع المطبخ', 'Kitchen type')} *</Label>
            <select
              id="kitchen_type"
              className={selectClass}
              value={form.kitchen_type}
              onChange={(e) => set({ kitchen_type: e.target.value })}
              required
            >
              {KITCHEN_TYPE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {lang === 'ar' ? o.ar : o.en}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-[var(--line)] pt-6">
        <h2 className="text-lg font-semibold text-[var(--ink)]">
          {tx('الأسعار والحد الأدنى', 'Prices & minimums')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="breakfast">{tx('سعر الإفطار (ر.ع)', 'Breakfast price (OMR)')}</Label>
            <Input
              id="breakfast"
              className="mt-1.5 h-11 ltr-data"
              inputMode="decimal"
              value={form.breakfast_price_omr}
              onChange={(e) => set({ breakfast_price_omr: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="lunch">{tx('سعر الغداء (ر.ع)', 'Lunch price (OMR)')}</Label>
            <Input
              id="lunch"
              className="mt-1.5 h-11 ltr-data"
              inputMode="decimal"
              value={form.lunch_price_omr}
              onChange={(e) => set({ lunch_price_omr: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="dinner">{tx('سعر العشاء (ر.ع)', 'Dinner price (OMR)')}</Label>
            <Input
              id="dinner"
              className="mt-1.5 h-11 ltr-data"
              inputMode="decimal"
              value={form.dinner_price_omr}
              onChange={(e) => set({ dinner_price_omr: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="min_qty">{tx('أقل عدد للطلب', 'Minimum order quantity')}</Label>
            <Input
              id="min_qty"
              className="mt-1.5 h-11 ltr-data"
              inputMode="numeric"
              value={form.min_order_qty}
              onChange={(e) => set({ min_order_qty: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="min_price">{tx('أقل سعر للطلب (ر.ع)', 'Minimum order price (OMR)')}</Label>
            <Input
              id="min_price"
              className="mt-1.5 h-11 ltr-data"
              inputMode="decimal"
              value={form.min_order_price_omr}
              onChange={(e) => set({ min_order_price_omr: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="desserts">{tx('نوع الحلويات', 'Dessert types')}</Label>
          <Input
            id="desserts"
            className="mt-1.5 h-11"
            placeholder={tx('مثال: عربية، غربية، كيك، بقلاوة…', 'e.g. Arabic, Western, cake, baklava…')}
            value={form.desserts_type}
            onChange={(e) => set({ desserts_type: e.target.value })}
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-[var(--line)] pt-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">
            {tx('صور المناسبات والبوفيه', 'Event & buffet photos')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tx(
              `حتى ${MAX_SUPPLIER_PHOTOS} صور — JPG أو PNG أو WebP`,
              `Up to ${MAX_SUPPLIER_PHOTOS} photos — JPG, PNG, or WebP`,
            )}
          </p>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper-deep)]/40 px-4 py-8 text-sm text-muted-foreground transition hover:border-brand-palm/40">
          <Upload className="size-5 text-brand-palm" />
          {tx('اضغط لرفع الصور', 'Click to upload photos')}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              onPickPhotos(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
        {previews.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previews.map((src, i) => (
              <div key={src} className="relative overflow-hidden rounded-xl border border-[var(--line)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute end-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"
                  aria-label={tx('حذف', 'Remove')}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div>
          <Label htmlFor="notes">{tx('ملاحظات', 'Notes')} ({tx('اختياري', 'optional')})</Label>
          <Textarea
            id="notes"
            className="mt-1.5 min-h-24"
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </div>
      </section>

      {isTurnstileConfigured() && (
        <TurnstileWidget action="supplier-apply" onToken={setTurnstileToken} />
      )}

      <Button type="submit" disabled={saving} className="h-12 w-full sm:w-auto sm:min-w-48">
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        {tx('إرسال طلب التسجيل', 'Submit application')}
      </Button>
    </form>
  )
}
