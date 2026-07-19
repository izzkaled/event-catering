'use client'

import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/language-provider'
import { PopularBadge } from '@/components/packages/popular-badge'
import { groupPackagesBySection, isPackagePopular, type PackageWithSection } from '@/lib/packages/types'
import { Check, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PackageSelector({
  packages,
  selected,
  onSelect,
}: {
  packages: PackageWithSection[]
  selected: PackageWithSection | null
  onSelect: (pkg: PackageWithSection) => void
}) {
  const { lang, t } = useLanguage()
  const sections = groupPackagesBySection(packages)

  return (
    <div className="flex flex-col gap-10">
      <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
        {lang === 'ar'
          ? 'اختر القسم والباقة المناسبة — الأسعار شهرية شفافة بالريال العُماني.'
          : 'Choose a service section and package — transparent monthly pricing in OMR.'}
      </div>

      {sections.map((section) => {
        const sectionName = lang === 'ar' ? section.name_ar : section.name_en
        const groupedByHours = section.packages.reduce<Record<number, PackageWithSection[]>>((acc, pkg) => {
          const h = pkg.hours_per_visit
          if (!acc[h]) acc[h] = []
          acc[h].push(pkg)
          return acc
        }, {})

        return (
          <div key={section.slug} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 border-b border-border pb-3">
              <h2 className="text-lg font-extrabold tracking-tight text-foreground">{sectionName}</h2>
            </div>

            {Object.entries(groupedByHours)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([hours, pkgs]) => (
                <div key={`${section.slug}-${hours}`} className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground">
                      {hours}
                    </span>
                    <h3 className="text-sm font-bold text-muted-foreground">
                      {hours} {t('booking.hours')} {lang === 'ar' ? 'لكل زيارة' : 'per visit'}
                    </h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {pkgs.map((pkg) => {
                      const active = selected?.id === pkg.id
                      const name = lang === 'ar' ? pkg.name_ar : pkg.name_en
                      const price = parseFloat(pkg.price_omr).toFixed(2)
                      const popular = isPackagePopular(pkg)

                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => onSelect(pkg)}
                          className={cn(
                            'group relative flex min-h-[120px] flex-col gap-3 rounded-2xl border bg-card p-4 text-start shadow-sm transition-all duration-200 active:scale-[0.98] sm:min-h-0 sm:p-5',
                            active
                              ? 'border-primary bg-primary/[0.04] shadow-md ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/35 hover:shadow-md',
                          )}
                        >
                          {popular && (
                            <PopularBadge className="absolute -top-2.5 start-4" />
                          )}

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 pt-1">
                              <p className="text-safe font-extrabold leading-snug group-hover:text-primary">{name}</p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <Badge variant="secondary" className="font-semibold">
                                  {pkg.visits_per_week}{' '}
                                  {lang === 'ar'
                                    ? pkg.visits_per_week === 1
                                      ? 'يوم/أسبوع'
                                      : 'أيام/أسبوع'
                                    : pkg.visits_per_week === 1
                                      ? 'day/week'
                                      : 'days/week'}
                                </Badge>
                                <Badge variant="outline" className="font-normal">
                                  {pkg.hours_per_visit} {t('booking.hours')}
                                </Badge>
                              </div>
                              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="size-3.5 shrink-0" />
                                {pkg.visits_per_month} {t('booking.visitsPerMonth')}
                                {lang === 'ar' ? ' · اشتراك شهري' : ' · monthly plan'}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                                active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
                              )}
                            >
                              {active ? <Check className="size-5" /> : <Sparkles className="size-4" />}
                            </span>
                          </div>

                          <div className="flex items-end justify-between border-t border-border/80 pt-3">
                            <span className="text-xs text-muted-foreground">
                              {lang === 'ar' ? 'شهرياً' : 'Monthly'}
                            </span>
                            <div className="text-end">
                              <span className="text-2xl font-extrabold tabular-nums text-primary">{price}</span>
                              <span className="ms-1 text-sm font-semibold text-muted-foreground">OMR</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        )
      })}
    </div>
  )
}
