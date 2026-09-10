'use client'

import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/language-provider'
import { PopularBadge } from '@/components/packages/popular-badge'
import { groupPackagesBySection, isPackagePopular, type PackageWithSection } from '@/lib/packages/types'
import { formatGuests, formatServiceHours } from '@/lib/packages/semantics'
import { Check, Users, Sparkles } from 'lucide-react'
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
          ? 'اختر قسم المناسبة والباقة — السعر استرشادي حسب عدد الأشخاص، ويُؤكَّد بعد مراجعة الطلب.'
          : 'Choose an occasion section and package — indicative price by guest count; confirmed after review.'}
      </div>

      {sections.map((section) => {
        const sectionName = lang === 'ar' ? section.name_ar : section.name_en
        const groupedByGuests = section.packages.reduce<Record<number, PackageWithSection[]>>((acc, pkg) => {
          const g = pkg.visits_per_week
          if (!acc[g]) acc[g] = []
          acc[g].push(pkg)
          return acc
        }, {})

        return (
          <div key={section.slug} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 border-b border-border pb-3">
              <h2 className="text-lg font-extrabold tracking-tight text-foreground">{sectionName}</h2>
            </div>

            {Object.entries(groupedByGuests)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([guests, pkgs]) => (
                <div key={`${section.slug}-${guests}`} className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground">
                      <Users className="size-4" />
                    </span>
                    <h3 className="text-sm font-bold text-muted-foreground">
                      {formatGuests(Number(guests), lang)}
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
                                  {formatGuests(pkg.visits_per_week, lang)}
                                </Badge>
                                <Badge variant="outline" className="font-normal">
                                  {formatServiceHours(pkg.hours_per_visit, lang)}
                                </Badge>
                              </div>
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                {lang === 'ar' ? 'سعر استرشادي للمناسبة' : 'Indicative event price'}
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
                              {t('hero.from')}
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
