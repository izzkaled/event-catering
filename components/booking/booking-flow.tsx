'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { PackageSelector } from '@/components/booking/package-selector'
import { OrderSummary } from '@/components/booking/order-summary'
import { LoginRequiredDialog } from '@/components/auth/login-required-dialog'
import { OmanPhoneInput } from '@/components/auth/oman-phone-input'
import {
  clearCheckoutDraft,
  getCheckoutDraft,
  saveCheckoutDraft,
  saveReturnTo,
} from '@/lib/auth/session-storage'
import { normalizePhone } from '@/lib/auth/phone'
import type { Package } from '@/lib/db/schema'
import {
  MUSCAT_AREAS,
  MUSCAT_AREAS_EN,
  PREFERRED_TIMES,
  PREFERRED_TIMES_EN,
  WEEK_DAYS_AR,
  WEEK_DAYS_EN,
} from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

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

export function BookingFlow({ packages }: { packages: Package[] }) {
  const router = useRouter()
  const { lang, t, dir } = useLanguage()

  const steps = [
    t('booking.step.package'),
    t('booking.step.details'),
    t('booking.step.schedule'),
    t('booking.step.review'),
    t('booking.step.done'),
  ]

  const [step, setStep] = useState(0)
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
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
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const draft = getCheckoutDraft<BookingDraft>()

      // Restore draft first (after login redirect)
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
          if (pkg) setSelectedPkg(pkg)
        }
        clearCheckoutDraft()
      }

      // Load saved account (Google or phone session)
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
        // Prefill empty fields from saved account (don't overwrite draft values)
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
  }, [packages])

  const areas = lang === 'ar' ? MUSCAT_AREAS : MUSCAT_AREAS_EN
  const times = lang === 'ar' ? PREFERRED_TIMES : PREFERRED_TIMES_EN
  const days = lang === 'ar' ? WEEK_DAYS_AR : WEEK_DAYS_EN
  const today = new Date().toISOString().split('T')[0]

  const toggleDay = (day: string) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  const canProceed = () => {
    if (step === 0) return !!selectedPkg
    if (step === 1) return name.trim() && phone.trim() && area && address.trim()
    if (step === 2) return startDate && preferredTime && preferredDays.length > 0
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

    setSubmitting(true)
    try {
      // Save account details for next time
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
        }),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(err?.error || 'Failed')
      }
      const order = await res.json()
      router.push(`/booking/success?order=${order.order_number}`)
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

      // Re-check session (phone or Google)
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

  if (!packages.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        {lang === 'ar' ? 'لا توجد باقات متاحة حالياً' : 'No packages available'}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <LoginRequiredDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          {steps.slice(0, 4).map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span
                className={`flex size-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  i < step
                    ? 'bg-accent text-accent-foreground'
                    : i === step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                }`}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={`hidden text-xs sm:block ${
                  i === step ? 'font-bold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <Progress value={(step / 3) * 100} className="h-2" />
      </div>

      {profileLoaded && loggedIn && (
        <p className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
          {lang === 'ar'
            ? 'تم تحميل بيانات حسابك — يمكنك تعديلها قبل تأكيد الطلب'
            : 'Your account details were loaded — you can edit them before confirming'}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        {step === 0 && (
          <PackageSelector packages={packages} selected={selectedPkg} onSelect={setSelectedPkg} />
        )}

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {t('booking.muscat_only')}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">{t('booking.name')}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <OmanPhoneInput
                value={phone}
                onChange={setPhone}
                label={t('booking.phone')}
                hint={t(
                  'مفتاح عُمان +968 — أدخل 8 أرقام',
                  'Oman +968 — enter 8 digits',
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t('booking.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="area">{t('booking.area')}</Label>
              <select
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{lang === 'ar' ? 'اختر المنطقة' : 'Select area'}</option>
                {areas.map((a, i) => (
                  <option key={a} value={MUSCAT_AREAS[i]}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">{t('booking.address')}</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">{t('booking.notes')}</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date">{t('booking.date')}</Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t('booking.time')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {times.map((time, i) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setPreferredTime(PREFERRED_TIMES[i])}
                    className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                      preferredTime === PREFERRED_TIMES[i]
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t('booking.days')}</Label>
              <div className="flex flex-wrap gap-2">
                {days.map((day, i) => {
                  const arDay = WEEK_DAYS_AR[i]
                  const active = preferredDays.includes(arDay)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(arDay)}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && selectedPkg && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-bold">{t('booking.review')}</h2>
            <div className="rounded-xl bg-secondary/50 p-4">
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
            </div>
          </div>
        )}

        {step < 4 && (
          <div className="mt-7 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={back} disabled={step === 0} className={step === 0 ? 'invisible' : ''}>
              <PrevIcon className="size-4" />
              {t('booking.back')}
            </Button>
            <div className="flex items-center gap-4">
              {step > 0 && selectedPkg && step < 3 && (
                <span className="text-sm text-muted-foreground">
                  {t('booking.total')}:{' '}
                  <span className="font-bold text-primary">
                    {parseFloat(selectedPkg.price_omr).toFixed(2)} OMR
                  </span>
                </span>
              )}
              <Button onClick={next} disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {step === 3 ? t('booking.confirm') : t('booking.next')}
                {!submitting && <NextIcon className="size-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
