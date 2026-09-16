'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/components/language-provider'
import { LoginRequiredDialog } from '@/components/auth/login-required-dialog'
import { OmanPhoneInput } from '@/components/auth/oman-phone-input'
import { TurnstileWidget, isTurnstileConfigured } from '@/components/cloudflare/turnstile-widget'
import { normalizePhone } from '@/lib/auth/phone'
import { saveReturnTo } from '@/lib/auth/session-storage'
import { MUSCAT_AREAS, MUSCAT_AREAS_EN, PREFERRED_TIMES, PREFERRED_TIMES_EN } from '@/lib/constants'
import { CATALOG_SERVICES, getServiceById } from '@/lib/experience/catalog'
import { OCCASION_OPTIONS } from '@/lib/experience/filters'
import {
  calculateExperiencePrice,
  formatOmr,
  formatServicePriceLabel,
  serviceLineTotal,
} from '@/lib/experience/pricing'
import { createEmptyDraft, getActiveDraftId, getDraft, saveDraft } from '@/lib/experience/save'
import { weekdayArFromIsoDate } from '@/lib/packages/semantics'
import type {
  CatalogService,
  ExperienceDraft,
  ExperiencePackage,
  OccasionType,
  ServiceCategory,
  VenueType,
} from '@/lib/experience/types'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'guests', ar: 'الضيوف', en: 'Guests' },
  { id: 'schedule', ar: 'الموعد والموقع', en: 'Date & Location' },
  { id: 'services', ar: 'الخدمات', en: 'Services' },
  { id: 'review', ar: 'المراجعة', en: 'Review' },
  { id: 'request', ar: 'الطلب', en: 'Request' },
] as const

const REVIEW_STEP = STEPS.findIndex((s) => s.id === 'review')
const REQUEST_STEP = STEPS.findIndex((s) => s.id === 'request')
const SCHEDULE_STEP = STEPS.findIndex((s) => s.id === 'schedule')

function occasionFromPackage(pkg: ExperiencePackage): OccasionType {
  const order: OccasionType[] = [
    'government',
    'meeting',
    'corporate',
    'private',
    'celebration',
    'events',
    'wedding',
    'large',
    'other',
  ]
  for (const id of order) {
    if (pkg.occasion_types.includes(id)) return id
  }
  if (pkg.category === 'government') return 'government'
  if (pkg.category === 'corporate') return 'corporate'
  if (pkg.category === 'meeting') return 'meeting'
  return 'other'
}

const SERVICE_GROUPS: { id: ServiceCategory; ar: string; en: string }[] = [
  { id: 'food_beverage', ar: 'المشروبات والضيافة', en: 'Food & Beverage' },
  { id: 'setup', ar: 'التجهيز', en: 'Setup' },
  { id: 'staff', ar: 'الطاقم', en: 'Staff' },
  { id: 'additional', ar: 'خدمات إضافية', en: 'Additional Services' },
]

const VENUES: { id: VenueType; ar: string; en: string }[] = [
  { id: 'indoor', ar: 'داخلي', en: 'Indoor' },
  { id: 'outdoor', ar: 'خارجي', en: 'Outdoor' },
  { id: 'venue', ar: 'قاعة / موقع', en: 'Venue' },
]

type Props = {
  pkg: ExperiencePackage
  /** Live services from admin library (preferred). Falls back to static catalog. */
  services?: CatalogService[]
  initialDraftId?: string | null
}

export function ExperienceBuilder({ pkg, services, initialDraftId }: Props) {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const catalog = services?.length ? services : CATALOG_SERVICES
  const resolveService = (id: string) => catalog.find((s) => s.id === id) || getServiceById(id)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<ExperienceDraft>(() =>
    createEmptyDraft({
      packageId: pkg.id,
      packageSlug: pkg.slug,
      occasion: occasionFromPackage(pkg),
      guests: pkg.visits_per_week,
      selectedServiceIds: [...pkg.included_service_ids],
      budget: null,
    }),
  )
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactArea, setContactArea] = useState('')
  const [contactAddress, setContactAddress] = useState('')
  const [contactNotes, setContactNotes] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)

  useEffect(() => {
    const draftId = initialDraftId || getActiveDraftId()
    if (!draftId) return
    const existing = getDraft(draftId)
    if (existing && existing.packageSlug === pkg.slug) {
      setDraft({
        ...existing,
        occasion: existing.occasion || occasionFromPackage(pkg),
        budget: null,
      })
      if (existing.location) setContactAddress((prev) => prev || existing.location)
    }
  }, [initialDraftId, pkg.slug])

  useEffect(() => {
    if (searchParams.get('request') === '1') setStep(REQUEST_STEP)
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    fetch('/api/profile', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok || cancelled) return
        const data = (await res.json()) as {
          user: {
            name: string | null
            phone: string | null
            email: string | null
            area: string | null
            address: string | null
          }
        }
        if (cancelled) return
        setContactName((prev) => prev || data.user.name || '')
        setContactPhone((prev) => prev || (data.user.phone || '').replace(/\D/g, '').replace(/^968/, '').slice(0, 8))
        setContactEmail((prev) => prev || data.user.email || '')
        setContactArea((prev) => prev || data.user.area || '')
        setContactAddress((prev) => prev || data.user.address || '')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const price = useMemo(
    () =>
      calculateExperiencePrice({
        pkg,
        guests: draft.guests,
        selectedServiceIds: draft.selectedServiceIds,
        venueType: draft.venueType,
        servicesCatalog: catalog,
      }),
    [pkg, draft, catalog],
  )

  const update = (patch: Partial<ExperienceDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  const persist = (opts?: { silent?: boolean }) => {
    const saved = saveDraft({
      ...draft,
      packageId: pkg.id,
      packageSlug: pkg.slug,
    })
    setDraft(saved)
    void fetch('/api/experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: saved.id,
        package_id: pkg.id.startsWith('fallback-') ? null : pkg.id,
        payload: saved,
        estimated_total_omr: price.estimatedTotal,
      }),
    }).catch(() => {})
    if (!opts?.silent) {
      toast.success(
        lang === 'ar'
          ? `تم حفظ تجربتك: ${saved.id}`
          : `Experience saved: ${saved.id}`,
      )
    }
    return saved
  }

  const toggleService = (id: string) => {
    if (pkg.included_service_ids.includes(id)) return
    update({
      selectedServiceIds: draft.selectedServiceIds.includes(id)
        ? draft.selectedServiceIds.filter((x) => x !== id)
        : [...draft.selectedServiceIds, id],
    })
  }

  const buildBrief = (experienceId: string) =>
    [
      `Experience ${experienceId}`,
      `Package: ${pkg.name_en} / ${pkg.name_ar}`,
      `Occasion: ${draft.occasion || occasionFromPackage(pkg)}`,
      `Guests: ${draft.guests}`,
      `Date: ${draft.date || '-'}`,
      `Time: ${draft.time || '-'}`,
      `Location: ${draft.location || '-'}`,
      `Venue: ${draft.venueType || '-'}`,
      `Services: ${draft.selectedServiceIds.join(', ')}`,
      `Estimated: ${price.estimatedTotal} OMR`,
      contactNotes.trim() ? `Customer notes: ${contactNotes.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n')

  const goToRequest = () => {
    if (!draft.date) {
      toast.error(lang === 'ar' ? 'حدّد تاريخ المناسبة أولًا' : 'Set the occasion date first')
      setStep(SCHEDULE_STEP)
      return
    }
    if (!draft.time || !(PREFERRED_TIMES as readonly string[]).includes(draft.time)) {
      toast.error(lang === 'ar' ? 'اختر وقتًا من القائمة' : 'Choose a time from the list')
      setStep(SCHEDULE_STEP)
      return
    }
    persist({ silent: true })
    if (draft.location && !contactAddress) setContactAddress(draft.location)
    setStep(REQUEST_STEP)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submitRequest = async () => {
    if (pkg.id.startsWith('fallback-')) {
      toast.error(
        lang === 'ar'
          ? 'هذه باقة تجريبية — اختر باقة من الكتالوج'
          : 'Demo package — pick a live package from the catalog',
      )
      router.push('/packages')
      return
    }
    if (!contactName.trim() || !contactPhone.trim() || !contactArea || !contactAddress.trim()) {
      toast.error(t('booking.required'))
      return
    }
    if (!draft.date || !draft.time) {
      toast.error(lang === 'ar' ? 'أكمل الموعد والموقع أولًا' : 'Complete date & location first')
      setStep(SCHEDULE_STEP)
      return
    }
    const normalized = normalizePhone(contactPhone)
    if (!normalized) {
      toast.error(t('booking.invalidPhone'))
      return
    }
    if (isTurnstileConfigured() && !turnstileToken) {
      toast.error(lang === 'ar' ? 'أكمل التحقق الأمني أولًا' : 'Complete the security check first')
      return
    }

    const profileRes = await fetch('/api/profile', { credentials: 'include' })
    if (!profileRes.ok) {
      saveReturnTo(`/experience?package=${pkg.slug}&request=1`)
      setLoginDialogOpen(true)
      return
    }

    const saved = persist({ silent: true })
    setSubmitting(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          phone: normalized,
          email: contactEmail.trim(),
          area: contactArea,
          address: contactAddress.trim(),
        }),
      }).catch(() => null)

      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: contactName.trim(),
          customer_phone: normalized,
          customer_email: contactEmail.trim() || null,
          customer_address: contactAddress.trim(),
          customer_area: contactArea,
          notes: buildBrief(saved.id),
          package_id: pkg.id,
          hours_per_visit: pkg.hours_per_visit,
          visits_per_week: draft.guests,
          visits_per_month: pkg.visits_per_month,
          price_omr: String(price.estimatedTotal),
          start_date: draft.date,
          preferred_time: draft.time,
          preferred_days: [weekdayArFromIsoDate(draft.date)],
          turnstileToken,
        }),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(err?.error || 'Failed')
      }
      const order = (await res.json()) as { order_number: string; confirmationPath?: string }
      toast.success(
        lang === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Request submitted successfully',
      )
      router.push(
        order.confirmationPath ||
          `/booking/request-received?order=${encodeURIComponent(order.order_number)}`,
      )
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : lang === 'ar'
            ? 'فشل إرسال الطلب'
            : 'Failed to submit request',
      )
      setSubmitting(false)
    }
  }

  const next = () => {
    if (step === SCHEDULE_STEP) {
      if (!draft.date) {
        toast.error(lang === 'ar' ? 'حدّد تاريخ المناسبة' : 'Set the occasion date')
        return
      }
      if (!draft.time || !(PREFERRED_TIMES as readonly string[]).includes(draft.time)) {
        toast.error(lang === 'ar' ? 'اختر وقتًا من القائمة' : 'Choose a time from the list')
        return
      }
      if (!draft.location.trim()) {
        toast.error(lang === 'ar' ? 'أدخل موقع المناسبة' : 'Enter the venue location')
        return
      }
    }
    if (step === REVIEW_STEP) {
      goToRequest()
      return
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }
  const back = () => setStep((s) => Math.max(0, s - 1))

  const areas = lang === 'ar' ? MUSCAT_AREAS : MUSCAT_AREAS_EN
  const times = lang === 'ar' ? PREFERRED_TIMES : PREFERRED_TIMES_EN
  const today = new Date().toISOString().split('T')[0]
  const stepId = STEPS[step]?.id
  const occasionLabel =
    OCCASION_OPTIONS.find((o) => o.id === (draft.occasion || occasionFromPackage(pkg)))?.[
      lang === 'ar' ? 'ar' : 'en'
    ] || '—'

  return (
    <div className="site-container relative py-8 pb-28 sm:py-12 sm:pb-12">
      <div className="mb-8 max-w-2xl">
        <p className="brand-kicker mb-2">Customize</p>
        <h1 className="font-ios text-2xl font-semibold tracking-tight sm:text-3xl">
          {lang === 'ar' ? pkg.name_ar : pkg.name_en}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === 'ar'
            ? 'الباقة محددة — أكمل الضيوف والموعد والخدمات ثم أرسل الطلب.'
            : 'Package selected — set guests, schedule, and services, then submit.'}
        </p>
        <p className="mt-3 inline-flex rounded-full border border-brand-sand/40 bg-brand-sand/10 px-3 py-1 text-xs font-semibold text-brand-palm">
          {lang === 'ar' ? `نوع المناسبة من الباقة: ${occasionLabel}` : `Occasion from package: ${occasionLabel}`}
        </p>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              if (i === REQUEST_STEP) {
                goToRequest()
                return
              }
              setStep(i)
            }}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition',
              i === step
                ? 'bg-brand-palm text-brand-cream'
                : i < step
                  ? 'bg-brand-sand/25 text-brand-palm'
                  : 'bg-secondary text-muted-foreground',
            )}
          >
            {String(i + 1).padStart(2, '0')} · {lang === 'ar' ? s.ar : s.en}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 rounded-2xl border border-border/80 bg-card/50 p-5 sm:p-6">
          {stepId === 'guests' && (
            <StepShell
              title={lang === 'ar' ? 'كم ضيفًا تتوقع؟' : 'How many guests do you expect?'}
            >
              <Label htmlFor="guests">{lang === 'ar' ? 'عدد الضيوف' : 'Guests'}</Label>
              <Input
                id="guests"
                type="number"
                min={pkg.min_guests}
                max={Math.max(pkg.max_guests, 500)}
                value={draft.guests}
                onChange={(e) => update({ guests: Number(e.target.value) || 0 })}
                className="mt-2 h-12 max-w-xs text-lg font-semibold"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {lang === 'ar'
                  ? `النطاق المقترح لهذه الباقة: ${pkg.min_guests}–${pkg.max_guests}`
                  : `Suggested range for this package: ${pkg.min_guests}–${pkg.max_guests}`}
              </p>
            </StepShell>
          )}

          {stepId === 'schedule' && (
            <StepShell
              title={lang === 'ar' ? 'متى وأين ستقام مناسبتك؟' : 'When and where is your occasion?'}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="date">{lang === 'ar' ? 'التاريخ' : 'Date'}</Label>
                  <Input
                    id="date"
                    type="date"
                    min={today}
                    value={draft.date}
                    onChange={(e) => update({ date: e.target.value })}
                    className="mt-2 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="time">{lang === 'ar' ? 'الوقت' : 'Time'}</Label>
                  <select
                    id="time"
                    value={draft.time}
                    onChange={(e) => update({ time: e.target.value })}
                    className="mt-2 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">{lang === 'ar' ? 'اختر الوقت' : 'Select time'}</option>
                    {PREFERRED_TIMES.map((arTime, i) => (
                      <option key={arTime} value={arTime}>
                        {times[i]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="location">{lang === 'ar' ? 'الموقع' : 'Location'}</Label>
                <Input
                  id="location"
                  value={draft.location}
                  onChange={(e) => update({ location: e.target.value })}
                  placeholder={lang === 'ar' ? 'مسقط، بوشر…' : 'Muscat, Bawshar…'}
                  className="mt-2 h-11"
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {VENUES.map((v) => (
                  <Choice
                    key={v.id}
                    active={draft.venueType === v.id}
                    onClick={() => update({ venueType: v.id })}
                    label={lang === 'ar' ? v.ar : v.en}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {stepId === 'services' && (
            <StepShell
              title={lang === 'ar' ? 'خصص تجربتك' : 'Customize Your Experience'}
            >
              <div className="space-y-8">
                {SERVICE_GROUPS.map((group) => {
                  const items = catalog.filter((s) => s.category === group.id)
                  if (!items.length) return null
                  return (
                    <div key={group.id}>
                      <h3 className="mb-3 font-ios text-base font-semibold">
                        {lang === 'ar' ? group.ar : group.en}
                      </h3>
                      <div className="grid gap-3">
                        {items.map((service) => {
                          const included = pkg.included_service_ids.includes(service.id)
                          const active = draft.selectedServiceIds.includes(service.id)
                          const line = serviceLineTotal(service, draft.guests)
                          return (
                            <button
                              key={service.id}
                              type="button"
                              disabled={included}
                              onClick={() => toggleService(service.id)}
                              className={cn(
                                'flex items-start justify-between gap-3 rounded-xl border p-4 text-start transition',
                                active || included
                                  ? 'border-brand-sand bg-brand-sand/10'
                                  : 'border-border hover:border-brand-sand/40',
                                included && 'opacity-90',
                              )}
                            >
                              <div>
                                <p className="font-ios font-semibold">
                                  {lang === 'ar' ? service.name_ar : service.name_en}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {lang === 'ar' ? service.description_ar : service.description_en}
                                </p>
                                {included && (
                                  <p className="mt-2 text-xs font-medium text-brand-palm">
                                    {lang === 'ar' ? 'مشمولة في الباقة' : 'Included in package'}
                                  </p>
                                )}
                                {!included && service.pricing_model === 'per_guest' && (
                                  <p className="mt-2 text-xs font-medium text-amber-800">
                                    {lang === 'ar'
                                      ? `يتغير مع عدد الضيوف (${draft.guests} ضيف)`
                                      : `Scales with guests (${draft.guests})`}
                                  </p>
                                )}
                              </div>
                              <div className="shrink-0 text-end">
                                {!included && (
                                  <p className="text-sm font-semibold text-primary">
                                    + {formatServicePriceLabel(service, draft.guests, lang)}
                                  </p>
                                )}
                                {!included && service.pricing_model === 'per_guest' && (
                                  <p className="ltr-data mt-1 text-[11px] text-muted-foreground">
                                    = {formatOmr(line, lang)}
                                  </p>
                                )}
                                <p className="mt-2 text-xs font-medium">
                                  {included || active
                                    ? lang === 'ar'
                                      ? 'مضافة'
                                      : 'Added'
                                    : lang === 'ar'
                                      ? 'إضافة'
                                      : 'Add'}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </StepShell>
          )}

          {stepId === 'review' && (
            <StepShell title={lang === 'ar' ? 'تجربتك' : 'Your Experience'}>
              <dl className="space-y-3 text-sm">
                <Row
                  label={lang === 'ar' ? 'الباقة' : 'Package'}
                  value={lang === 'ar' ? pkg.name_ar : pkg.name_en}
                />
                <Row label={lang === 'ar' ? 'المناسبة' : 'Occasion'} value={occasionLabel} />
                <Row label={lang === 'ar' ? 'الضيوف' : 'Guests'} value={String(draft.guests)} />
                <Row label={lang === 'ar' ? 'التاريخ' : 'Date'} value={draft.date || '—'} />
                <Row label={lang === 'ar' ? 'الوقت' : 'Time'} value={draft.time || '—'} />
                <Row label={lang === 'ar' ? 'الموقع' : 'Location'} value={draft.location || '—'} />
                <Row
                  label={lang === 'ar' ? 'خدمات إضافية' : 'Additional Services'}
                  value={
                    draft.selectedServiceIds
                      .filter((id) => !pkg.included_service_ids.includes(id))
                      .map((id) => {
                        const s = resolveService(id)
                        return s ? (lang === 'ar' ? s.name_ar : s.name_en) : id
                      })
                      .join(' · ') || (lang === 'ar' ? 'لا يوجد' : 'None')
                  }
                />
                <Row
                  label={lang === 'ar' ? 'التقدير' : 'Estimated Total'}
                  value={formatOmr(price.estimatedTotal, lang)}
                  strong
                />
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                {lang === 'ar'
                  ? 'السعر النهائي قد يختلف حسب الموقع والتوفر والخدمات المختارة.'
                  : 'Final price may vary depending on location, availability and selected services.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setStep(0)}>
                  {lang === 'ar' ? 'عدّل التجربة' : 'Edit Experience'}
                </Button>
                <Button type="button" className="rounded-full" onClick={goToRequest}>
                  {lang === 'ar' ? 'متابعة لإرسال الطلب' : 'Continue to request'}
                </Button>
              </div>
            </StepShell>
          )}

          {stepId === 'request' && (
            <StepShell
              title={lang === 'ar' ? 'أرسل طلب مناسبتك' : 'Submit your occasion request'}
            >
              <p className="mb-5 text-sm text-muted-foreground">
                {lang === 'ar'
                  ? 'بيانات التواصل وموقع المناسبة — بعدها نراجع التفاصيل ونؤكد العرض.'
                  : 'Contact details and venue — we’ll review and confirm the quote.'}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="contact-name">{t('booking.name')}</Label>
                  <Input
                    id="contact-name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="mt-2 h-11"
                  />
                </div>
                <div>
                  <OmanPhoneInput
                    value={contactPhone}
                    onChange={setContactPhone}
                    label={t('booking.phone')}
                    hint={t('booking.phoneHint')}
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email">{t('booking.email')}</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-2 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-area">{t('booking.area')}</Label>
                  <select
                    id="contact-area"
                    value={contactArea}
                    onChange={(e) => setContactArea(e.target.value)}
                    className="mt-2 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">{lang === 'ar' ? 'اختر المنطقة' : 'Select area'}</option>
                    {MUSCAT_AREAS.map((arArea, i) => (
                      <option key={arArea} value={arArea}>
                        {areas[i]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="contact-address">{t('booking.address')}</Label>
                  <Input
                    id="contact-address"
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    className="mt-2 h-11"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="contact-notes">{t('booking.notes')}</Label>
                  <Textarea
                    id="contact-notes"
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    className="mt-2 min-h-24"
                  />
                </div>
              </div>
              {isTurnstileConfigured() && (
                <div className="mt-4">
                  <TurnstileWidget action="experience-request" onToken={setTurnstileToken} />
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setStep(REVIEW_STEP)}
                  disabled={submitting}
                >
                  {lang === 'ar' ? 'رجوع للمراجعة' : 'Back to review'}
                </Button>
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={submitRequest}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="me-2 size-4 animate-spin" />}
                  {lang === 'ar' ? 'إرسال الطلب' : 'Submit request'}
                </Button>
              </div>
            </StepShell>
          )}

          <div className="mt-8 hidden items-center justify-between gap-3 border-t border-border pt-5 sm:flex">
            <Button type="button" variant="ghost" disabled={step === 0 || submitting} onClick={back} className="rounded-full">
              {lang === 'ar' ? 'السابق' : 'Back'}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => persist()} className="rounded-full" disabled={submitting}>
                {lang === 'ar' ? 'احفظ تجربتي' : 'Save My Experience'}
              </Button>
              {step < REVIEW_STEP && (
                <Button type="button" onClick={next} className="rounded-full">
                  {lang === 'ar' ? 'متابعة التخطيط' : 'Continue Planning'}
                </Button>
              )}
              {step === REVIEW_STEP && (
                <Button type="button" onClick={goToRequest} className="rounded-full">
                  {lang === 'ar' ? 'متابعة لإرسال الطلب' : 'Continue to request'}
                </Button>
              )}
              {step === REQUEST_STEP && (
                <Button type="button" onClick={submitRequest} className="rounded-full" disabled={submitting}>
                  {submitting && <Loader2 className="me-2 size-4 animate-spin" />}
                  {lang === 'ar' ? 'إرسال الطلب' : 'Submit request'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image src={pkg.cover_image} alt="" fill className="object-cover" sizes="320px" />
            </div>
            <PricePanel price={price} lang={lang} />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {lang === 'ar'
                ? 'السعر النهائي قد يختلف حسب الموقع والتوفر والخدمات المختارة.'
                : 'Final price may vary depending on location, availability and selected services.'}
            </p>
            <Button
              render={<Link href={`/packages/${pkg.slug}`} />}
              nativeButton={false}
              variant="outline"
              className="h-10 w-full rounded-full"
            >
              {lang === 'ar' ? 'تفاصيل الباقة' : 'Package details'}
            </Button>
          </div>
        </aside>
      </div>

      {/* Mobile sticky summary */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'التقدير' : 'Estimated'}</p>
            <p className="font-ios text-lg font-semibold tabular-nums">
              {formatOmr(price.estimatedTotal, lang)}
            </p>
          </div>
          {step < REVIEW_STEP ? (
            <Button type="button" onClick={next} className="h-11 rounded-full px-5">
              {lang === 'ar' ? 'متابعة' : 'Continue'}
            </Button>
          ) : step === REVIEW_STEP ? (
            <Button type="button" onClick={goToRequest} className="h-11 rounded-full px-5">
              {lang === 'ar' ? 'الطلب' : 'Request'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={submitRequest}
              className="h-11 rounded-full px-5"
              disabled={submitting}
            >
              {submitting && <Loader2 className="me-2 size-4 animate-spin" />}
              {lang === 'ar' ? 'إرسال' : 'Submit'}
            </Button>
          )}
        </div>
      </div>

      <LoginRequiredDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        returnTo={`/experience?package=${pkg.slug}&request=1`}
      />
    </div>
  )
}

function StepShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-5 font-ios text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  )
}

function Choice({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border px-4 py-3 text-start text-sm font-medium transition',
        active ? 'border-brand-sand bg-brand-sand/15 text-brand-palm' : 'border-border hover:border-brand-sand/40',
      )}
    >
      {label}
    </button>
  )
}

function Row({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('text-end', strong && 'font-ios text-base font-semibold text-primary')}>{value}</dd>
    </div>
  )
}

function PricePanel({
  price,
  lang,
}: {
  price: ReturnType<typeof calculateExperiencePrice>
  lang: 'ar' | 'en'
}) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-ios text-base font-semibold">{lang === 'ar' ? 'ملخص السعر' : 'Price summary'}</p>
      <Line label={lang === 'ar' ? 'الباقة' : 'Package'} value={formatOmr(price.packageBase, lang)} />
      {price.guestsExtra > 0 && (
        <Line label={lang === 'ar' ? 'الضيوف الإضافيون' : 'Extra guests'} value={`+ ${formatOmr(price.guestsExtra, lang)}`} />
      )}
      {price.services > 0 && (
        <Line label={lang === 'ar' ? 'خدمات إضافية' : 'Additional services'} value={`+ ${formatOmr(price.services, lang)}`} />
      )}
      {price.setup > 0 && (
        <Line label={lang === 'ar' ? 'التجهيز' : 'Setup'} value={`+ ${formatOmr(price.setup, lang)}`} />
      )}
      {price.staff > 0 && (
        <Line label={lang === 'ar' ? 'الطاقم' : 'Staff'} value={`+ ${formatOmr(price.staff, lang)}`} />
      )}
      {price.location > 0 && (
        <Line label={lang === 'ar' ? 'الموقع / التوصيل' : 'Location / delivery'} value={`+ ${formatOmr(price.location, lang)}`} />
      )}
      <div className="flex justify-between border-t border-border pt-2 font-ios text-lg font-semibold">
        <span>{lang === 'ar' ? 'التقدير' : 'Estimated Total'}</span>
        <span className="text-primary">{formatOmr(price.estimatedTotal, lang)}</span>
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  )
}
