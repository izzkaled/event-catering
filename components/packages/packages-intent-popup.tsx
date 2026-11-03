'use client'

import { useEffect, useId, useRef } from 'react'
import Image from 'next/image'
import { Check, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { GUEST_BANDS, MEAL_TYPES, type MealType } from '@/lib/experience/filters'
import type { GuestBand } from '@/lib/experience/types'
import { cn } from '@/lib/utils'

const MEAL_IMAGES: Record<MealType, string> = {
  breakfast: '/images/meals/breakfast.jpg',
  lunch: '/images/meals/lunch.jpg',
  dinner: '/images/meals/dinner.jpg',
}

type PackagesIntentPopupProps = {
  open: boolean
  meal: MealType | null
  guestBand: GuestBand | null
  matchCount?: number
  onMealChange: (meal: MealType) => void
  onGuestChange: (band: GuestBand) => void
  onConfirm: () => void
  onSkip: () => void
}

export function PackagesIntentPopup({
  open,
  meal,
  guestBand,
  matchCount,
  onMealChange,
  onGuestChange,
  onConfirm,
  onSkip,
}: PackagesIntentPopupProps) {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const canConfirm = Boolean(meal && guestBand)
  const step = !meal ? 1 : !guestBand ? 2 : 3

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip()
      if (e.key === 'Enter' && canConfirm) onConfirm()
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('button')?.focus()
    }, 40)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, canConfirm, onConfirm, onSkip])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(28,12,28,0.55)] backdrop-blur-[3px]"
        aria-label={isAr ? 'تخطي وعرض الكل' : 'Skip and show all'}
        onClick={onSkip}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-brand-sand/25 sm:max-w-lg sm:rounded-[1.25rem]',
          'bg-[var(--brand-cream,#f7f1e7)] shadow-[0_28px_64px_-28px_rgba(42,18,42,0.65)]',
          'animate-[fade-up_0.35s_ease-out]',
        )}
      >
        <div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-sand via-brand-palm to-brand-sand"
          aria-hidden
        />

        <div className="relative px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          <div className="flex items-start justify-between gap-2.5">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-brand-sand">
                {isAr ? 'خطوة سريعة' : 'Quick start'}
              </p>
              <h2
                id={titleId}
                className="mt-1 font-ios text-xl font-semibold tracking-tight text-brand-palm sm:text-[1.45rem]"
              >
                {isAr ? 'وش نوع الضيافة؟' : 'What kind of hospitality?'}
              </h2>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {isAr
                  ? 'حدّد الوجبة وعدد الضيوف لنرشّح لك الباقات الأنسب.'
                  : 'Choose a meal and guest count — we’ll surface the best-fit packages.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onSkip}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-white/70 text-muted-foreground transition hover:border-brand-sand/50 hover:text-brand-palm"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Steps */}
          <ol className="mt-4 flex items-center gap-2" aria-label={isAr ? 'خطوات الفلتر' : 'Filter steps'}>
            {[
              { n: 1, label: isAr ? 'الوجبة' : 'Meal', done: Boolean(meal) },
              { n: 2, label: isAr ? 'الضيوف' : 'Guests', done: Boolean(guestBand) },
            ].map((s, i) => (
              <li key={s.n} className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition',
                    s.done
                      ? 'border-brand-sand bg-brand-sand text-brand-palm'
                      : step === s.n
                        ? 'border-brand-palm bg-brand-palm text-brand-cream'
                        : 'border-border bg-white text-muted-foreground',
                  )}
                >
                  {s.done ? <Check className="size-3.5" strokeWidth={2.5} /> : s.n}
                </span>
                <span
                  className={cn(
                    'truncate text-xs font-semibold',
                    s.done || step === s.n ? 'text-brand-palm' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </span>
                {i === 0 && <span className="mx-1 h-px flex-1 bg-border" aria-hidden />}
              </li>
            ))}
          </ol>

          {/* Meal */}
          <div className="mt-4 sm:mt-5">
            <p className="mb-2 text-xs font-semibold text-brand-palm sm:text-sm">
              {isAr ? '١. الوجبة' : '1. Meal'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MEAL_TYPES.map((item) => {
                const active = meal === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onMealChange(item.id)}
                    className={cn(
                      'group overflow-hidden rounded-xl border text-center transition active:scale-[0.98] sm:rounded-2xl',
                      active
                        ? 'border-brand-palm ring-2 ring-brand-palm/30 shadow-[0_10px_28px_-18px_rgba(74,35,74,0.55)]'
                        : 'border-border/80 bg-white hover:border-brand-sand/55',
                    )}
                  >
                    <span className="relative block aspect-[5/4] overflow-hidden bg-secondary sm:aspect-[4/3]">
                      <Image
                        src={MEAL_IMAGES[item.id]}
                        alt=""
                        fill
                        className={cn(
                          'object-cover transition duration-300',
                          active ? 'scale-105' : 'group-hover:scale-[1.03]',
                        )}
                        sizes="120px"
                      />
                      <span
                        className={cn(
                          'absolute inset-0 transition',
                          active ? 'bg-brand-palm/25' : 'bg-black/10 group-hover:bg-transparent',
                        )}
                      />
                      {active && (
                        <span className="absolute end-2 top-2 flex size-6 items-center justify-center rounded-full bg-brand-sand text-brand-palm">
                          <Check className="size-3.5" strokeWidth={2.5} />
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'block px-1 py-2 text-xs font-semibold sm:px-1.5 sm:py-2.5 sm:text-sm',
                        active ? 'bg-brand-palm text-brand-cream' : 'bg-white text-foreground',
                      )}
                    >
                      {isAr ? item.ar : item.en}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Guests */}
          <div className={cn('mt-4 transition-opacity sm:mt-5', meal ? 'opacity-100' : 'opacity-55')}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-palm sm:text-sm">
              <Users className="size-3.5" strokeWidth={2} />
              {isAr ? '٢. عدد الأشخاص' : '2. Number of guests'}
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {GUEST_BANDS.map((band) => {
                const active = guestBand === band.id
                return (
                  <button
                    key={band.id}
                    type="button"
                    onClick={() => onGuestChange(band.id)}
                    className={cn(
                      'rounded-full border px-2.5 py-1.5 text-xs font-semibold transition active:scale-[0.98] sm:px-3.5 sm:py-2 sm:text-sm',
                      active
                        ? 'border-brand-sand bg-brand-sand/30 text-brand-palm'
                        : 'border-border bg-white text-muted-foreground hover:border-brand-sand/45',
                    )}
                  >
                    {isAr ? band.ar : band.en}
                  </button>
                )
              })}
            </div>
          </div>

          {typeof matchCount === 'number' && canConfirm && (
            <p className="mt-3.5 text-center text-xs font-medium text-brand-palm sm:mt-4 sm:text-sm">
              {isAr
                ? `جاهز — ${matchCount} باقة تناسب اختيارك`
                : `Ready — ${matchCount} package${matchCount === 1 ? '' : 's'} match`}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row-reverse sm:items-center">
            <Button
              type="button"
              size="lg"
              disabled={!canConfirm}
              onClick={onConfirm}
              className="h-10 w-full rounded-full border-0 bg-gradient-to-br from-[#e0b45a] via-brand-sand to-[#a67c2d] font-ios text-sm text-[var(--ink)] shadow-[0_10px_26px_-10px_rgba(168,124,45,0.75)] disabled:opacity-40 sm:h-11 sm:flex-1"
            >
              {isAr ? 'عرض الباقات المناسبة' : 'Show matching packages'}
            </Button>
            <button
              type="button"
              onClick={onSkip}
              className="px-3 py-1.5 text-xs font-semibold text-muted-foreground underline-offset-4 transition hover:text-brand-palm hover:underline sm:px-4 sm:text-sm"
            >
              {isAr ? 'عرض الكل بدون فلتر' : 'Browse all'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
