'use client'

import { Fragment, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  MapPin,
  Sparkles,
  UserCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { PackageSelector } from '@/components/booking/package-selector'
import { BookingTrustBadges, OrderSummary } from '@/components/booking/order-summary'
import { LoginRequiredDialog } from '@/components/auth/login-required-dialog'
import { OmanPhoneInput } from '@/components/auth/oman-phone-input'
import {
  clearCheckoutDraft,
  getCheckoutDraft,
  saveCheckoutDraft,
  saveReturnTo,
} from '@/lib/auth/session-storage'
import { normalizePhone } from '@/lib/auth/phone'
import type { PackageWithSection } from '@/lib/packages/types'

import {
  MUSCAT_AREAS,
  MUSCAT_AREAS_EN,
  PREFERRED_TIMES,
  PREFERRED_TIMES_EN,
} from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { TurnstileWidget, isTurnstileConfigured } from '@/components/cloudflare/turnstile-widget'
import {
  formatBookingDate,
} from '@/lib/booking/schedule'
import { formatGuests, formatServiceHours, weekdayArFromIsoDate, weekdayFromIsoDate } from '@/lib/packages/semantics'
type BookingDraft = {
  step: number
  selectedPackageId: string | null
  name: string
  phone: string
  email: string
  area: string
  address: string
  notes: string
  startDate: string
  preferredTime: string
  preferredDays: string[]
}

type ProfileUser = {
  name: string | null
  phone: string | null
  email: string | null
  area: string | null
  address: string | null
}

function localPhoneDigits(phone: string | null | undefined) {
  if (!phone) return ''
  return phone.replace(/\D/g, '').replace(/^968/, '').slice(0, 8)
}

const STEP_ICONS = [Sparkles, UserCircle, CalendarDays, ClipboardCheck] as const

function StepHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Sparkles
  title: string
  description: string
}) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-border pb-4 sm:mb-6 sm:gap-4 sm:pb-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-12 sm:rounded-2xl">
        <Icon className="size-5 sm:size-6" />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold tracking-tight sm:text-xl md:text-2xl">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{description}</p>
      </div>
    </div>
  )
}

export function BookingFlow({ packages }: { packages: PackageWithSection[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang, t, dir } = useLanguage()

  const steps = [
    t('booking.step.package'),
    t('booking.step.details'),
    t('booking.step.schedule'),
    t('booking.step.review'),
  ]

  const stepDescriptions = [
    lang === 'ar' ? 'اختر باقة الضيافة حسب عدد الأشخاص' : 'Choose a hospitality package by guest count',
    lang === 'ar' ? 'أدخل بيانات الجهة وموقع المناسبة' : 'Enter organization details and venue',
    lang === 'ar' ? 'حدّد تاريخ المناسبة والوقت المفضل' : 'Pick event date and preferred time',
    lang === 'ar' ? 'راجع الطلب قبل الإرسال' : 'Review your request before submitting',
  ]

  const [step, setStep] = useState(0)
  const [selectedPkg, setSelectedPkg] = useState<PackageWithSection | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [startDate, setStartDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [preferredDays, setPreferredDays] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const draft = getCheckoutDraft<BookingDraft>()
      let appliedFromDraft = false

      if (draft) {
        setStep(draft.step)
        setName(draft.name)
        setPhone(localPhoneDigits(draft.phone))
        setEmail(draft.email)
        setArea(draft.area)
        setAddress(draft.address)
        setNotes(draft.notes)
        setStartDate(draft.startDate)
        setPreferredTime(draft.preferredTime)
        setPreferredDays(draft.preferredDays)
        if (draft.selectedPackageId) {
          const pkg = packages.find((p) => p.id === draft.selectedPackageId)
          if (pkg) {
            setSelectedPkg(pkg)
            appliedFromDraft = true
          }
        }
        clearCheckoutDraft()
      }

      // Deep-link from chat: /booking?package=<id>
      if (!appliedFromDraft) {
        const packageId = searchParams.get('package')?.trim()
        if (packageId) {
          const pkg = packages.find((p) => p.id === packageId)
          if (pkg) setSelectedPkg(pkg)
        }
      }

      try {
        const res = await fetch('/api/profile', { credentials: 'include' })
        if (!res.ok) {
          if (!cancelled) {
            setLoggedIn(false)
            setProfileLoaded(true)
          }
          return
        }
        const data = (await res.json()) as { user: ProfileUser }
        if (cancelled) return

        setLoggedIn(true)
        setName((prev) => prev || data.user.name || '')
        setPhone((prev) => prev || localPhoneDigits(data.user.phone))
        setEmail((prev) => prev || data.user.email || '')
        setArea((prev) => prev || data.user.area || '')
        setAddress((prev) => prev || data.user.address || '')
      } catch {
        if (!cancelled) setLoggedIn(false)
      } finally {
        if (!cancelled) setProfileLoaded(true)
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [packages, searchParams])

  const areas = lang === 'ar' ? MUSCAT_AREAS : MUSCAT_AREAS_EN
  const times = lang === 'ar' ? PREFERRED_TIMES : PREFERRED_TIMES_EN
  const today = new Date().toISOString().split('T')[0]

  const selectPackage = (pkg: PackageWithSection) => {
    setSelectedPkg(pkg)
  }

  useEffect(() => {
    if (!startDate) return
    // Always store Arabic weekday for API validation; display via preferredDays label separately if needed
    setPreferredDays([weekdayArFromIsoDate(startDate)])
  }, [startDate])

  const canProceed = () => {
    if (step === 0) return !!selectedPkg
    if (step === 1) return name.trim() && phone.trim() && area && address.trim()
    if (step === 2) {
      return Boolean(startDate && preferredTime && preferredDays.length === 1)
    }
    return true
  }

  const persistProfile = async () => {
    const normalized = normalizePhone(phone)
    await fetch('/api/profile', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        phone: normalized || phone,
        email: email.trim(),
        area,
        address: address.trim(),
      }),
    }).catch(() => null)
  }

  const submitOrder = async () => {
    if (!selectedPkg) return
    const normalized = normalizePhone(phone)
    if (!normalized) {
      toast.error(t('booking.invalidPhone'))
      return
    }
    if (isTurnstileConfigured() && !turnstileToken) {
      toast.error(
        lang === 'ar' ? 'أكمل التحقق الأمني أولاً' : 'Complete the security check first',
      )
      return
    }

    setSubmitting(true)
    try {
      await persistProfile()

      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_phone: normalized,
          customer_email: email.trim() || null,
          customer_address: address.trim(),
          customer_area: area,
          notes: notes.trim() || null,
          package_id: selectedPkg.id,
          hours_per_visit: selectedPkg.hours_per_visit,
          visits_per_week: selectedPkg.visits_per_week,
          visits_per_month: selectedPkg.visits_per_month,
          price_omr: selectedPkg.price_omr,
          start_date: startDate,
          preferred_time: preferredTime,
          preferred_days: preferredDays,
          turnstileToken,
        }),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(err?.error || 'Failed')
      }
      const order = (await res.json()) as {
        id: string
        order_number: string
        needsPayment?: boolean
      }

      // Always go to payment method picker (Paymob card / bank transfer)
      router.push(`/booking/payment?order=${encodeURIComponent(order.order_number)}`)
      return
    } catch (e) {
      toast.error(e instanceof Error ? e.message : lang === 'ar' ? 'فشل إرسال الطلب' : 'Failed to submit order')
      setSubmitting(false)
    }
  }

  const next = async () => {
    if (!canProceed()) {
      toast.error(t('booking.required'))
      return
    }

    if (step === 1) {
      if (!normalizePhone(phone)) {
        toast.error(t('booking.invalidPhone'))
        return
      }
    }

    if (step === 3) {
      if (!selectedPkg) return

      const profileRes = await fetch('/api/profile', { credentials: 'include' })
      const isAuthed = profileRes.ok
      setLoggedIn(isAuthed)

      if (!isAuthed) {
        saveReturnTo('/booking')
        saveCheckoutDraft({
          step,
          selectedPackageId: selectedPkg.id,
          name,
          phone,
          email,
          area,
          address,
          notes,
          startDate,
          preferredTime,
          preferredDays,
        })
        setLoginDialogOpen(true)
        return
      }

      await submitOrder()
      return
    }

    setStep((s) => Math.min(s + 1, steps.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const back = () => setStep((s) => Math.max(s - 1, 0))

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight
  const StepIcon = STEP_ICONS[step] ?? Sparkles

  if (!packages.length) {
    return (
      <div className="site-container-narrow py-20 text-center">
        <p className="text-lg text-muted-foreground">
          {lang === 'ar' ? 'لا توجد باقات متاحة حالياً' : 'No packages available'}
        </p>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="pointer-events-none absolute -start-32 top-20 size-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -end-32 bottom-0 size-80 rounded-full bg-primary/10 blur-3xl" />

      <LoginRequiredDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />

      {/* Hero */}
      <div className="relative border-b border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="site-container py-6 sm:py-12">
          <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary sm:mb-3 sm:px-4 sm:py-1.5 sm:text-sm">
            <Sparkles className="size-3.5 sm:size-4" />
            {lang === 'ar' ? 'طلب ضيافة سريع' : 'Fast hospitality request'}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            {t('nav.booking')}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:mt-2 sm:text-base">
            {lang === 'ar'
              ? '4 خطوات — اختر الباقة وعدد الأشخاص، موقع المناسبة، التاريخ، ثم أرسل الطلب.'
              : '4 steps — choose package & guests, venue, date, then submit your request.'}
          </p>
        </div>
      </div>

      <div className="site-container relative layout-with-sidebar py-6 pb-28 sm:py-8 sm:pb-8 lg:py-10">
        {/* Main column */}
        <div className="min-w-0">
          {/* Stepper */}
          <div className="mb-4 sm:mb-8">
            <p className="mb-3 text-center text-sm font-bold text-foreground sm:hidden">
              {steps[step]} · {step + 1}/{steps.length}
            </p>
            <div className="flex min-w-0 items-center overflow-x-clip">
              {steps.map((label, i) => (
                <Fragment key={label}>
                  <div className="flex min-w-0 flex-col items-center gap-2">
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all sm:size-11',
                        i < step
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : i === step
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                            : 'border border-border bg-card text-muted-foreground',
                      )}
                    >
                      {i < step ? <Check className="size-4" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        'hidden max-w-[22%] truncate text-center text-[11px] sm:block sm:max-w-none sm:text-xs',
                        i === step ? 'font-bold text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        'mx-1 h-0.5 min-w-[3%] max-w-8 flex-1 rounded-full sm:mx-2',
                        i < step ? 'bg-primary/50' : 'bg-border',
                      )}
                    />
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          {profileLoaded && loggedIn && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              <Check className="size-4 shrink-0" />
              {lang === 'ar'
                ? 'تم تحميل بيانات حسابك — يمكنك تعديلها قبل التأكيد'
                : 'Account details loaded — edit anytime before confirming'}
            </div>
          )}

          {selectedPkg && (
            <Card className="mb-4 border-border/80 lg:hidden">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">
                  {lang === 'ar' ? 'ملخص سريع' : 'Quick summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <OrderSummary
                  compact
                  pkg={selectedPkg}
                  customerName={step >= 1 ? name : undefined}
                  customerArea={step >= 1 ? area : undefined}
                  startDate={step >= 2 ? startDate : undefined}
                  preferredTime={step >= 2 ? preferredTime : undefined}
                />
              </CardContent>
            </Card>
          )}

          <Card className="border-border/80 shadow-lg shadow-primary/5">
            <CardContent className="p-4 sm:p-8">
              <StepHeader
                icon={StepIcon}
                title={steps[step]}
                description={stepDescriptions[step]}
              />

              {step === 0 && (
                <>
                  <PackageSelector
                    packages={packages}
                    selected={selectedPkg}
                    onSelect={selectPackage}
                  />
                  {selectedPkg && (
                    <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
                      <p className="text-sm font-bold text-primary">{t('booking.packageWeeklyVisits')}</p>
                      <p className="mt-2 text-2xl font-extrabold tabular-nums text-foreground">
                        {formatGuests(selectedPkg.visits_per_week, lang)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatServiceHours(selectedPkg.hours_per_visit, lang)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{t('booking.daysPerWeekHint')}</p>
                    </div>
                  )}
                </>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    {t('booking.muscat_only')}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('booking.name')}</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={lang === 'ar' ? 'اسم الجهة أو المسؤول' : 'Organization or contact name'}
                        className="h-11"
                      />
                    </div>
                    <OmanPhoneInput
                      value={phone}
                      onChange={setPhone}
                      label={t('booking.phone')}
                      hint={t('booking.phoneHint')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('booking.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11"
                    />
                  </div>

                  <div className="rounded-xl border border-border/80 bg-secondary/20 p-5 space-y-4">
                    <p className="text-sm font-bold">{lang === 'ar' ? 'موقع الضيافة' : 'Hospitality venue'}</p>
                    <div className="space-y-2">
                      <Label htmlFor="area">{t('booking.area')}</Label>
                      <select
                        id="area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <option value="">{lang === 'ar' ? 'اختر المنطقة' : 'Select area'}</option>
                        {areas.map((a, i) => (
                          <option key={a} value={MUSCAT_AREAS[i]}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">{t('booking.address')}</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={
                          lang === 'ar'
                            ? 'اسم المبنى / القاعة، الشارع، المدينة'
                            : 'Building / hall, street, city'
                        }
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('booking.notes')}</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder={
                        lang === 'ar'
                          ? 'نوع المناسبة، تفاصيل إضافية، متطلبات خاصة…'
                          : 'Event type, extras, special requirements…'
                      }
                      className="min-h-[88px] resize-y"
                    />
                  </div>
                </div>
              )}

              {step === 2 && selectedPkg && (
                <div className="flex flex-col gap-6">
                  <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 text-sm">
                    <p className="font-bold">{formatGuests(selectedPkg.visits_per_week, lang)}</p>
                    <p className="mt-1 text-muted-foreground">
                      {lang === 'ar'
                        ? `${formatServiceHours(selectedPkg.hours_per_visit, lang)} · سعر استرشادي ${parseFloat(selectedPkg.price_omr).toFixed(2)} ر.ع`
                        : `${formatServiceHours(selectedPkg.hours_per_visit, lang)} · from ${parseFloat(selectedPkg.price_omr).toFixed(2)} OMR`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">{t('booking.date')}</Label>
                    <Input
                      id="date"
                      type="date"
                      min={today}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-11 w-full max-w-full sm:max-w-xs"
                    />
                  </div>

                  {startDate && (
                    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4 sm:p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">
                        {t('booking.subscriptionPeriod')}
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-background/80 p-3">
                          <p className="text-xs text-muted-foreground">{t('booking.date')}</p>
                          <p className="mt-1 text-sm font-bold">{formatBookingDate(startDate, lang)}</p>
                        </div>
                        <div className="rounded-xl bg-background/80 p-3">
                          <p className="text-xs text-muted-foreground">{t('booking.days')}</p>
                          <p className="mt-1 text-sm font-bold">
                            {preferredDays[0]
                              ? weekdayFromIsoDate(startDate, lang)
                              : '—'}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {t('booking.subscriptionHint')}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>{t('booking.time')}</Label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {times.map((time, i) => {
                        const active = preferredTime === PREFERRED_TIMES[i]
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setPreferredTime(PREFERRED_TIMES[i])}
                            className={cn(
                              'min-h-[48px] rounded-xl border px-3 py-3 text-sm font-semibold transition-all active:scale-[0.98]',
                              active
                                ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5',
                            )}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && selectedPkg && (
                <>
                  <OrderSummary
                    pkg={selectedPkg}
                    customerName={name}
                    customerPhone={normalizePhone(phone) || phone}
                    customerArea={area}
                    customerAddress={address}
                    startDate={startDate}
                    preferredTime={preferredTime}
                    preferredDays={preferredDays}
                  />
                  <TurnstileWidget action="booking" onToken={setTurnstileToken} />
                </>
              )}

              {/* Desktop navigation */}
              <div className="mt-6 hidden flex-col-reverse gap-3 border-t border-border pt-5 sm:mt-8 sm:flex sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                <Button
                  variant="ghost"
                  onClick={back}
                  disabled={step === 0}
                  className={cn('h-11 gap-2', step === 0 && 'invisible')}
                >
                  <PrevIcon className="size-4" />
                  {t('booking.back')}
                </Button>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {selectedPkg && step < 3 && (
                    <div className="rounded-xl bg-secondary/50 px-4 py-2 text-center sm:text-end">
                      <span className="text-xs text-muted-foreground">{t('booking.total')}</span>
                      <p className="text-lg font-extrabold tabular-nums text-primary">
                        {parseFloat(selectedPkg.price_omr).toFixed(2)}{' '}
                        <span className="text-sm font-semibold">OMR</span>
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={next}
                    disabled={submitting}
                    size="lg"
                    className="h-12 gap-2 px-8 shadow-md shadow-primary/15"
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {step === 3
                      ? t('booking.continue_payment')
                      : t('booking.next')}
                    {!submitting && <NextIcon className="size-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile trust badges */}
          <Card className="mt-4 border-dashed bg-muted/20 lg:hidden">
            <CardContent className="p-4">
              <BookingTrustBadges />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <Card className="border-border/80 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {lang === 'ar' ? 'ملخص الطلب' : 'Order summary'}
                </CardTitle>
                <CardDescription>
                  {selectedPkg
                    ? lang === 'ar'
                      ? 'يتحدّث تلقائياً مع كل خطوة'
                      : 'Updates as you complete each step'
                    : lang === 'ar'
                      ? 'اختر باقة للبدء'
                      : 'Select a package to start'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPkg ? (
                  <OrderSummary
                    compact
                    pkg={selectedPkg}
                    customerName={step >= 1 ? name : undefined}
                    customerPhone={step >= 1 ? normalizePhone(phone) || phone : undefined}
                    customerArea={step >= 1 ? area : undefined}
                    customerAddress={step >= 1 ? address : undefined}
                    startDate={step >= 2 ? startDate : undefined}
                    preferredTime={step >= 2 ? preferredTime : undefined}
                    preferredDays={step >= 2 ? preferredDays : undefined}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {lang === 'ar'
                      ? 'ستظهر تفاصيل اشتراكك هنا بعد اختيار الباقة.'
                      : 'Your subscription details will appear here after you pick a package.'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-dashed bg-muted/20">
              <CardContent className="p-5">
                <BookingTrustBadges />
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md pb-safe sm:hidden">
        <div className="flex items-center gap-2 px-3 py-3">
          <Button
            variant="outline"
            size="icon"
            onClick={back}
            disabled={step === 0}
            className="size-11 shrink-0"
            aria-label={t('booking.back')}
          >
            <PrevIcon className="size-5" />
          </Button>
          {selectedPkg && (
            <div className="min-w-0 flex-1 rounded-xl bg-secondary/60 px-3 py-1.5 text-center">
              <span className="block text-[10px] text-muted-foreground">{t('booking.total')}</span>
              <span className="text-base font-extrabold tabular-nums text-primary">
                {parseFloat(selectedPkg.price_omr).toFixed(2)} OMR
              </span>
            </div>
          )}
          <Button
            onClick={next}
            disabled={submitting}
            className="flex-fluid-btn h-11 gap-1 text-base shadow-md"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {step === 3
              ? t('booking.continue_payment')
              : t('booking.next')}
            {!submitting && <NextIcon className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
