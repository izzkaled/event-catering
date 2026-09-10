'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PackageCard } from '@/components/packages/package-card'
import { PackageCompare } from '@/components/packages/package-compare'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { toExperiencePackage } from '@/lib/packages/experience-map'
import { GUEST_BANDS } from '@/lib/experience/filters'
import type { ExperiencePackage, GuestBand } from '@/lib/experience/types'
import type { PackageWithSection } from '@/lib/packages/types'
import type { PackageCategory } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

function filterDynamic(
  packages: ExperiencePackage[],
  filter: string,
  guestBand: GuestBand | null,
) {
  return packages.filter((pkg) => {
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
}

export function PackagesCatalog({
  packages,
  categories = [],
}: {
  packages: PackageWithSection[]
  categories?: PackageCategory[]
}) {
  const { lang } = useLanguage()
  const enriched = useMemo(
    () => packages.map((p) => toExperiencePackage(p)).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [packages],
  )
  const [filter, setFilter] = useState('all')
  const [guestBand, setGuestBand] = useState<GuestBand | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [dynamicCats, setDynamicCats] = useState<PackageCategory[]>(categories)

  useEffect(() => {
    if (categories.length) return
    fetch('/api/admin/package-categories?public=1')
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setDynamicCats(Array.isArray(rows) ? rows : []))
      .catch(() => {})
  }, [categories])

  const filtered = useMemo(
    () => filterDynamic(enriched, filter, guestBand),
    [enriched, filter, guestBand],
  )

  const featured = enriched.find((p) => p.is_popular || p.is_recommended || p.is_featured) || enriched[0]

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
          {lang === 'ar' ? 'لا توجد باقات منشورة حاليًا' : 'No published packages yet'}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {lang === 'ar'
            ? 'أخبرنا بما تخطط له وسنرشدك عندما تتوفر التجارب.'
            : 'Tell us what you’re planning — we’ll guide you when experiences are available.'}
        </p>
        <Button render={<Link href="/experience/find" />} nativeButton={false} className="mt-6 rounded-full">
          {lang === 'ar' ? 'اعثر على تجربتي' : 'Find My Experience'}
        </Button>
      </div>
    )
  }

  return (
    <div className="site-container py-10 sm:py-14">
      <div className="max-w-2xl text-start">
        <p className="brand-kicker mb-3">Packages</p>
        <h1 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem]">
          {lang === 'ar' ? 'ضيافة مصممة لمناسبتك.' : 'Hospitality designed for your occasion.'}
        </h1>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-muted-foreground">
          {lang === 'ar'
            ? 'اختر نقطة البداية المناسبة لك، ثم خصص التفاصيل حسب احتياجك.'
            : 'Choose a starting point, then customize the details to your needs.'}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-brand-sand/35 bg-brand-sand/10 p-5 sm:p-6">
        <p className="font-ios text-base font-semibold text-brand-palm">
          {lang === 'ar' ? 'غير متأكد ما يناسب مناسبتك؟' : 'Not sure what fits your occasion?'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === 'ar'
            ? 'أخبرنا بما تخطط له، وسنرشدك إلى التجربة المناسبة.'
            : 'Tell us what you’re planning. We’ll guide you.'}
        </p>
        <Button
          render={<Link href="/experience/find" />}
          nativeButton={false}
          className="mt-4 h-11 rounded-full px-6 font-ios"
        >
          {lang === 'ar' ? 'اعثر على تجربتي' : 'Find My Experience'}
        </Button>
      </div>

      <div className="mt-10 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'rounded-full border px-3.5 py-2 text-sm font-medium transition',
              filter === 'all'
                ? 'border-brand-palm bg-brand-palm text-brand-cream'
                : 'border-border bg-card text-muted-foreground hover:border-brand-sand/50',
            )}
          >
            {lang === 'ar' ? 'جميع الباقات' : 'All packages'}
          </button>
          {dynamicCats.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.slug)}
              className={cn(
                'rounded-full border px-3.5 py-2 text-sm font-medium transition',
                filter === f.slug
                  ? 'border-brand-palm bg-brand-palm text-brand-cream'
                  : 'border-border bg-card text-muted-foreground hover:border-brand-sand/50',
              )}
            >
              {lang === 'ar' ? f.name_ar : f.name_en}
            </button>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {lang === 'ar' ? 'عدد الضيوف' : 'Guest count'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGuestBand(null)}
              className={cn(
                'rounded-full border px-3.5 py-2 text-sm font-medium transition',
                guestBand === null
                  ? 'border-brand-sand bg-brand-sand/20 text-brand-palm'
                  : 'border-border text-muted-foreground',
              )}
            >
              {lang === 'ar' ? 'الكل' : 'Any'}
            </button>
            {GUEST_BANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setGuestBand(b.id)}
                className={cn(
                  'rounded-full border px-3.5 py-2 text-sm font-medium transition',
                  guestBand === b.id
                    ? 'border-brand-sand bg-brand-sand/20 text-brand-palm'
                    : 'border-border text-muted-foreground',
                )}
              >
                {lang === 'ar' ? b.ar : b.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {featured && filter === 'all' && !guestBand && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-brand-sand/40 bg-secondary/30">
          <div className="grid gap-0 lg:grid-cols-2">
            <div className="relative min-h-[16rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.cover_image} alt="" className="absolute inset-0 size-full object-cover" />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="brand-kicker mb-2">Featured</p>
              <h2 className="font-ios text-2xl font-semibold tracking-tight">
                {lang === 'ar' ? featured.name_ar : featured.name_en}
              </h2>
              <p className="mt-2 text-sm font-medium text-brand-palm">
                {lang === 'ar'
                  ? featured.badge_ar || 'الأكثر اختيارًا للمناسبات المتوسطة'
                  : featured.badge_en || 'Most chosen for mid-size occasions'}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {lang === 'ar' ? featured.description_ar : featured.description_en}
              </p>
              <Button
                render={<Link href={`/packages/${featured.slug}`} />}
                nativeButton={false}
                className="mt-6 h-11 w-fit rounded-full px-6 font-ios"
              >
                {lang === 'ar' ? 'اختر هذه التجربة' : 'Choose This Experience'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            selected={compareIds.includes(pkg.id)}
            onToggleCompare={toggleCompare}
            compareDisabled={compareIds.length >= 3}
          />
        ))}
      </div>

      {!filtered.length && (
        <p className="mt-12 text-center text-muted-foreground">
          {lang === 'ar'
            ? 'لا توجد باقات مطابقة. جرّب فلترًا آخر أو اعثر على تجربتك.'
            : 'No matching packages. Try another filter or find your experience.'}
        </p>
      )}

      {compareIds.length >= 2 && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-6">
          <button
            type="button"
            onClick={() => setShowCompare(true)}
            className="rounded-full bg-brand-palm px-6 py-3 font-ios text-sm font-semibold text-brand-cream shadow-lg"
          >
            {lang === 'ar'
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
