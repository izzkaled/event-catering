'use client'

import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/language-provider'
import type { Package } from '@/lib/db/schema'
import { Check, Clock, Sparkles, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PackageSelector({
  packages,
  selected,
  onSelect,
}: {
  packages: Package[]
  selected: Package | null
  onSelect: (pkg: Package) => void
}) {
  const { lang, t } = useLanguage()

  const grouped = packages.reduce<Record<number, Package[]>>((acc, pkg) => {
    const h = pkg.hours_per_visit
    if (!acc[h]) acc[h] = []
    acc[h].push(pkg)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
        {lang === 'ar'
          ? 'اختر عدد ساعات الزيارة وعدد الزيارات الأسبوعية — الأسعار شهرية شفافة بالريال العُماني.'
          : 'Pick visit hours and weekly frequency — transparent monthly pricing in OMR.'}
      </div>

      {Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([hours, pkgs]) => (
          <div key={hours} className="flex flex-col gap-4">
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
                    {pkg.is_featured && (
                      <Badge className="absolute -top-2.5 start-4 gap-1 bg-primary text-primary-foreground shadow-sm">
                        <Star className="size-3 fill-current" />
                        {t('booking.featured')}
                      </Badge>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="font-extrabold leading-snug group-hover:text-primary">{name}</p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3.5 shrink-0" />
                          {pkg.visits_per_week} {t('booking.visitsPerWeek')} · {pkg.visits_per_month}{' '}
                          {t('booking.visitsPerMonth')}
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
}
