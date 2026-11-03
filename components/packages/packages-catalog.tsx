'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CaretDown, FunnelSimple, MagnifyingGlass, Users } from '@phosphor-icons/react'
import { PackageCard } from '@/components/packages/package-card'
import { PackageCompare } from '@/components/packages/package-compare'
import { PackagesIntentPopup } from '@/components/packages/packages-intent-popup'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import {
  GUEST_BANDS,
  MEAL_TYPES,
  packageMatchesMeal,
  type MealType,
} from '@/lib/experience/filters'
import { toExperiencePackage } from '@/lib/packages/experience-map'
import type { ExperiencePackage, GuestBand } from '@/lib/experience/types'
import type { PackageWithSection } from '@/lib/packages/types'
import type { PackageCategory } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'event-packages-intent-v1'

type IntentState = {
  meal: MealType | null
  guestBand: GuestBand | null
  confirmed: boolean
}

function readStoredIntent(): IntentState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as IntentState
  } catch {
    return null
  }
}

function writeStoredIntent(value: IntentState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function filterPackages(
  packages: ExperiencePackage[],
  filter: string,
  guestBand: GuestBand | null,
  meal: MealType | null,
  query: string,
) {
  const q = query.trim().toLowerCase()
  const byCategoryAndGuests = packages.filter((pkg) => {
    const byFilter =
      filter === 'all' ||
      pkg.occasion_types.includes(filter as ExperiencePackage['occasion_types'][number]) ||
      pkg.category === filter
    if (!byFilter) return false
    if (!guestBand) return true
    const band = GUEST_BANDS.find((b) => b.id === guestBand)
    if (!band) return true
    return pkg.min_guests <= band.max && pkg.max_guests >= band.min
  })

  const mealScoped = (() => {
    if (!meal) return byCategoryAndGuests
    const mealMatched = byCategoryAndGuests.filter((pkg) => packageMatchesMeal(pkg, meal))
    return mealMatched.length ? mealMatched : byCategoryAndGuests
  })()

  if (!q) return mealScoped
  return mealScoped.filter((pkg) => {
    const hay = [pkg.name_ar, pkg.name_en, pkg.description_ar, pkg.description_en, pkg.badge_ar, pkg.badge_en]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] sm:px-3.5 sm:py-2 sm:text-sm',
        active
          ? 'border-brand-palm bg-brand-palm text-brand-cream shadow-sm'
          : 'border-transparent bg-[var(--paper-deep)] text-[var(--ink-soft)] hover:border-brand-sand/40',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function PackagesCatalog({
  packages,
  categories = [],
}: {
  packages: PackageWithSection[]
  categories?: PackageCategory[]
}) {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'
  const enriched = useMemo(
    () =>
      packages
        .map((p) => toExperiencePackage(p))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [packages],
  )

  const [filter, setFilter] = useState('all')
  const [meal, setMeal] = useState<MealType | null>(null)
  const [guestBand, setGuestBand] = useState<GuestBand | null>(null)
  const [query, setQuery] = useState('')
  const [popupOpen, setPopupOpen] = useState(false)
  const [intentConfirmed, setIntentConfirmed] = useState(false)
  const [booted, setBooted] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [dynamicCats, setDynamicCats] = useState<PackageCategory[]>(categories)

  useEffect(() => {
    const stored = readStoredIntent()
    if (stored?.confirmed) {
      setMeal(stored.meal)
      setGuestBand(stored.guestBand)
      setIntentConfirmed(true)
      setPopupOpen(false)
    } else {
      setPopupOpen(true)
    }
    setBooted(true)
  }, [])

  useEffect(() => {
    if (!booted || !intentConfirmed) return
    writeStoredIntent({ meal, guestBand, confirmed: true })
  }, [meal, guestBand, booted, intentConfirmed])

  const confirmIntent = () => {
    writeStoredIntent({ meal, guestBand, confirmed: true })
    setIntentConfirmed(true)
    setPopupOpen(false)
  }

  const skipIntent = () => {
    setMeal(null)
    setGuestBand(null)
    writeStoredIntent({ meal: null, guestBand: null, confirmed: true })
    setIntentConfirmed(true)
    setPopupOpen(false)
  }

  useEffect(() => {
    if (categories.length) return
    fetch('/api/admin/package-categories?public=1')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setDynamicCats(Array.isArray(rows) ? rows : []))
      .catch(() => {})
  }, [categories])

  const hasActiveFilters = Boolean(meal || guestBand || filter !== 'all' || query.trim())

  const filtered = useMemo(
    () => filterPackages(enriched, filter, guestBand, meal, query),
    [enriched, filter, guestBand, meal, query],
  )

  const featured =
    enriched.find((p) => p.is_popular || p.is_recommended || p.is_featured) || enriched[0]

  const showFeatured = Boolean(featured && !hasActiveFilters)
  const gridPackages = showFeatured
    ? filtered.filter((p) => p.id !== featured!.id)
    : filtered

  const clearFilters = () => {
    setMeal(null)
    setGuestBand(null)
    setFilter('all')
    setQuery('')
    writeStoredIntent({ meal: null, guestBand: null, confirmed: true })
    setIntentConfirmed(true)
  }

  const popupMatchCount = useMemo(
    () => filterPackages(enriched, 'all', guestBand, meal, '').length,
    [enriched, guestBand, meal],
  )

  const mealLabel = MEAL_TYPES.find((m) => m.id === meal)
  const guestLabel = GUEST_BANDS.find((b) => b.id === guestBand)

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const comparePackages = enriched.filter((p) => compareIds.includes(p.id))

  if (!enriched.length) {
    return (
      <div className="site-container py-20 text-center">
        <h1 className="font-ios text-3xl font-semibold">
          {isAr ? 'لا توجد باقات منشورة حاليًا' : 'No published packages yet'}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {isAr
            ? 'أخبرنا بما تخطط له وسنرشدك عندما تتوفر التجارب.'
            : 'Tell us what you’re planning — we’ll guide you when experiences are available.'}
        </p>
        <Button render={<Link href="/experience/find" />} nativeButton={false} className="mt-6">
          {isAr ? 'اعثر على تجربتي' : 'Find My Experience'}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('pb-24 sm:pb-16', !booted && 'min-h-[50vh]')}>
      <PackagesIntentPopup
        open={popupOpen}
        meal={meal}
        guestBand={guestBand}
        matchCount={popupMatchCount}
        onMealChange={setMeal}
        onGuestChange={setGuestBand}
        onConfirm={confirmIntent}
        onSkip={skipIntent}
      />

      <div className="site-container space-y-3 py-3.5 sm:space-y-4 sm:py-6 md:py-7">
        {/* 1) Hero panel */}
        <section className="relative overflow-hidden rounded-2xl bg-[#2e142e] px-4 py-5 shadow-[0_18px_44px_-30px_rgba(42,18,42,0.65)] sm:rounded-[1.35rem] sm:px-6 sm:py-6">
          {/* Geometric pattern — tiled SVG, slow drift */}
          <div
            className="pkg-geo pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'url(/images/brand/packages-geo.svg)',
              backgroundRepeat: 'repeat',
              backgroundSize: '88px 88px',
              opacity: 0.55,
            }}
            aria-hidden
          />
          {/* Soft wash — keeps text readable without hiding the geometry */}
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(46,20,46,0.42)_0%,rgba(46,20,46,0.12)_50%,rgba(46,20,46,0.28)_100%)]"
            aria-hidden
          />
          <div
            className="pkg-orb pointer-events-none absolute -end-8 -top-10 size-40 rounded-full bg-[#c9a86c]/18 blur-3xl sm:size-52"
            aria-hidden
          />
          <div
            className="pkg-orb pointer-events-none absolute -start-12 bottom-[-2.5rem] size-36 rounded-full bg-[#f7f1e7]/10 blur-3xl [animation-delay:-4.5s]"
            aria-hidden
          />
          {/* Large decorative star (visible geometric accent) */}
          <svg
            className="pkg-star pointer-events-none absolute -end-6 top-6 size-36 text-[#c9a86c] opacity-40 sm:-end-4 sm:top-8 sm:size-44"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden
          >
            <path
              d="M50 4 L64 36 L98 50 L64 64 L50 96 L36 64 L2 50 L36 36 Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M50 22 L58 40 L78 50 L58 60 L50 78 L42 60 L22 50 L42 40 Z"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="currentColor"
              fillOpacity="0.08"
            />
            <circle cx="50" cy="50" r="4" fill="currentColor" opacity="0.5" />
          </svg>

          <div className="relative max-w-2xl">
            <p className="pkg-enter flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#e0c48a]">
              <span className="pkg-dot inline-block size-1.5 rounded-full bg-[#e0c48a]" aria-hidden />
              Packages
            </p>
            <h1
              className="pkg-enter mt-1.5 font-ios text-[1.45rem] font-semibold leading-snug tracking-tight text-[#f7f1e7] sm:text-2xl md:text-[1.85rem]"
              style={{ ['--pkg-i' as string]: 1 }}
            >
              {isAr ? 'ضيافة مصممة لمناسبتك.' : 'Hospitality designed for your occasion.'}
            </h1>
            <p
              className="pkg-enter mt-2 max-w-xl text-[0.84rem] leading-relaxed text-[#f7f1e7]/88 sm:text-sm"
              style={{ ['--pkg-i' as string]: 2 }}
            >
              {isAr
                ? 'اختر نقطة البداية المناسبة لك، ثم خصص التفاصيل حسب احتياجك.'
                : 'Choose a starting point, then customize the details to your needs.'}
            </p>
          </div>

          <div
            className="pkg-enter relative mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f7f1e7] px-3 py-2.5 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3"
            style={{ ['--pkg-i' as string]: 3 }}
          >
            <p className="text-xs font-medium text-[#3d3631] sm:text-sm">
              {isAr
                ? `${filtered.length} باقة معروضة`
                : `${filtered.length} package${filtered.length === 1 ? '' : 's'}`}
            </p>
            <Link
              href="/experience/find"
              className="text-xs font-semibold text-[#4a234a] underline-offset-4 hover:underline sm:text-sm"
            >
              {isAr ? 'اعثر على تجربتي' : 'Find my experience'}
            </Link>
          </div>
        </section>

        {/* 2) Intent panel — meal / guests */}
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_10px_28px_-24px_rgba(31,26,23,0.4)] sm:rounded-[1.25rem]">
          <div className="grid grid-cols-2 gap-1 border-b border-[var(--line)] bg-[var(--paper-deep)]/70 p-1">
            <button
              type="button"
              onClick={() => setPopupOpen(true)}
              className={cn(
                'rounded-xl px-2.5 py-2 text-xs font-semibold transition sm:text-sm',
                meal
                  ? 'bg-white text-brand-palm shadow-sm'
                  : 'text-[var(--ink-muted)] hover:text-brand-palm',
              )}
            >
              {mealLabel
                ? isAr
                  ? mealLabel.ar
                  : mealLabel.en
                : isAr
                  ? 'اختر الوجبة'
                  : 'Choose meal'}
            </button>
            <button
              type="button"
              onClick={() => setPopupOpen(true)}
              className={cn(
                'rounded-xl px-2.5 py-2 text-xs font-semibold transition sm:text-sm',
                guestBand
                  ? 'bg-white text-brand-palm shadow-sm'
                  : 'text-[var(--ink-muted)] hover:text-brand-palm',
              )}
            >
              {guestLabel
                ? isAr
                  ? `${guestLabel.ar} ضيف`
                  : `${guestLabel.en} guests`
                : isAr
                  ? 'عدد الضيوف'
                  : 'Guest count'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPopupOpen(true)}
            className="flex w-full items-center gap-2.5 px-3.5 py-3 text-start transition hover:bg-[var(--paper-deep)]/40 sm:gap-3 sm:px-4 sm:py-3.5"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-sand/20 text-brand-palm sm:size-9">
              {meal || guestBand ? (
                <FunnelSimple weight="bold" className="size-4" />
              ) : (
                <Users weight="duotone" className="size-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-[var(--ink)] sm:text-sm">
                {meal || guestBand
                  ? isAr
                    ? 'فلتر الضيافة المحدد'
                    : 'Active hospitality filter'
                  : isAr
                    ? 'حدّد نوع الضيافة'
                    : 'Set your hospitality filter'}
              </span>
              <span className="mt-0.5 block truncate text-[0.72rem] text-[var(--ink-muted)] sm:text-xs">
                {meal || guestBand
                  ? [
                      mealLabel ? (isAr ? mealLabel.ar : mealLabel.en) : null,
                      guestLabel
                        ? isAr
                          ? `${guestLabel.ar} شخص`
                          : `${guestLabel.en} guests`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : isAr
                    ? 'اضغط لاختيار الوجبة وعدد الضيوف'
                    : 'Tap to choose meal and guest count'}
              </span>
            </span>
            <CaretDown weight="bold" className="size-3.5 shrink-0 text-[var(--ink-muted)]" />
          </button>

          {(meal || guestBand) && (
            <div className="flex items-center justify-between border-t border-[var(--line)] px-3.5 py-2 sm:px-4">
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[var(--ink-muted)] underline-offset-2 hover:text-brand-palm hover:underline"
              >
                {isAr ? 'مسح الفلتر' : 'Clear filter'}
              </button>
              <button
                type="button"
                onClick={() => setPopupOpen(true)}
                className="text-xs font-semibold text-brand-palm"
              >
                {isAr ? 'تعديل' : 'Edit'}
              </button>
            </div>
          )}
        </section>

        {/* 3) Search panel */}
        <section className="rounded-2xl border border-[var(--line)] bg-white px-3.5 py-2.5 shadow-[0_10px_28px_-24px_rgba(31,26,23,0.3)] sm:rounded-[1.25rem] sm:px-4 sm:py-3">
          <label className="flex items-center gap-2.5">
            <MagnifyingGlass weight="bold" className="size-4 shrink-0 text-brand-palm sm:size-[1.1rem]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isAr ? 'ابحث عن باقة أو مناسبة…' : 'Search for a package or occasion…'
              }
              className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)]"
            />
          </label>
        </section>

        {/* 4) Categories */}
        <section className="rounded-2xl border border-[var(--line)] bg-white px-2.5 py-2 shadow-[0_10px_28px_-24px_rgba(31,26,23,0.3)] sm:rounded-[1.25rem] sm:px-3 sm:py-2.5">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">
            <Chip active={filter === 'all'} onClick={() => setFilter('all')} className="shrink-0">
              {isAr ? 'الكل' : 'All'}
            </Chip>
            {dynamicCats.map((f) => (
              <Chip
                key={f.id}
                active={filter === f.slug}
                onClick={() => setFilter(f.slug)}
                className="shrink-0"
              >
                {isAr ? f.name_ar : f.name_en}
              </Chip>
            ))}
          </div>
        </section>

        {/* 5) Results */}
        <section className="pt-0.5">
          {showFeatured && featured && (
            <div
              id={`package-${featured.slug}`}
              className="pkg-feature group relative mb-3.5 overflow-hidden rounded-2xl border border-brand-sand/35 bg-white shadow-[0_12px_32px_-26px_rgba(74,35,74,0.4)] scroll-mt-24 sm:mb-4 sm:rounded-[1.25rem]"
            >
              <span
                aria-hidden
                className="pkg-sheen pointer-events-none absolute inset-y-0 z-[2] w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent"
              />
              <div className="grid gap-0 md:grid-cols-2">
                <div className="relative aspect-[16/9] overflow-hidden md:aspect-auto md:min-h-[12rem] lg:min-h-[14rem]">
                  <div className="pkg-ken absolute inset-0">
                    <Image
                      src={featured.cover_image}
                      alt={isAr ? featured.name_ar : featured.name_en}
                      fill
                      className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                      sizes="(max-width:768px) 100vw, 50vw"
                      priority
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center p-4 sm:p-5 md:p-6">
                  <p className="brand-kicker mb-1.5 text-[0.65rem]">Featured</p>
                  <h2 className="font-ios text-lg font-semibold tracking-tight sm:text-xl">
                    {isAr ? featured.name_ar : featured.name_en}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-brand-palm sm:text-sm">
                    {isAr
                      ? featured.badge_ar || 'الأكثر اختيارًا للمناسبات المتوسطة'
                      : featured.badge_en || 'Most chosen for mid-size occasions'}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:line-clamp-3 sm:text-sm">
                    {isAr ? featured.description_ar : featured.description_en}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <Button
                      render={<Link href={`/experience?package=${featured.slug}`} />}
                      nativeButton={false}
                      className="h-9 px-4 font-ios text-sm sm:h-10 sm:px-5"
                    >
                      {isAr ? 'خصص هذه التجربة' : 'Customize'}
                    </Button>
                    <Link
                      href={`/packages/${featured.slug}`}
                      className="text-xs font-semibold text-brand-palm underline-offset-4 hover:underline sm:text-sm"
                    >
                      {isAr ? 'التفاصيل' : 'Details'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:gap-4 lg:grid-cols-3">
              {(showFeatured ? gridPackages : filtered).map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  index={index}
                  selected={compareIds.includes(pkg.id)}
                  onToggleCompare={toggleCompare}
                  compareDisabled={compareIds.length >= 3}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--line)] bg-white px-4 py-10 text-center shadow-sm sm:rounded-[1.25rem] sm:px-6 sm:py-12">
              <p className="font-ios text-base font-semibold text-foreground sm:text-lg">
                {isAr ? 'لا توجد باقات مطابقة' : 'No matching packages'}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                {isAr
                  ? 'جرّب مسح الفلاتر أو أخبرنا بما تخطط له لنرشدك.'
                  : 'Try clearing filters, or tell us what you’re planning.'}
              </p>
              <div className="mt-4 flex flex-col items-center gap-2.5 sm:mt-5 sm:flex-row sm:justify-center">
                <Button type="button" onClick={clearFilters} className="h-9 px-5 font-ios text-sm sm:h-10">
                  {isAr ? 'مسح الفلاتر' : 'Clear filters'}
                </Button>
                <Button
                  render={<Link href="/experience/find" />}
                  nativeButton={false}
                  variant="outline"
                  className="h-9 px-5 font-ios text-sm sm:h-10"
                >
                  {isAr ? 'اعثر على تجربتي' : 'Find My Experience'}
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {compareIds.length >= 2 && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-6">
          <button
            type="button"
            onClick={() => setShowCompare(true)}
            className="pkg-enter rounded-full bg-brand-palm px-6 py-3 font-ios text-sm font-semibold text-brand-cream shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            {isAr
              ? `قارن الباقات (${compareIds.length})`
              : `Compare packages (${compareIds.length})`}
          </button>
        </div>
      )}

      {showCompare && (
        <PackageCompare packages={comparePackages} onClose={() => setShowCompare(false)} />
      )}
    </div>
  )
}
