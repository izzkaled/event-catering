'use client'

import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/language-provider'
import type { Package } from '@/lib/db/schema'
import { Check } from 'lucide-react'

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
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold">{t('booking.selectPackage')}</h2>
      </div>

      {Object.entries(grouped)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([hours, pkgs]) => (
          <div key={hours} className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-muted-foreground">
              {hours} {t('booking.hours')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {pkgs.map((pkg) => {
                const active = selected?.id === pkg.id
                const name = lang === 'ar' ? pkg.name_ar : pkg.name_en
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => onSelect(pkg)}
                    className={`relative flex flex-col gap-2 rounded-xl border p-4 text-right transition-colors ${
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {pkg.is_featured && (
                      <Badge className="absolute -top-2 left-3 bg-accent text-accent-foreground">
                        {t('booking.featured')}
                      </Badge>
                    )}
                    <span className="font-bold">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      {pkg.hours_per_visit} {t('booking.hours')} | {pkg.visits_per_week}{' '}
                      {t('booking.visitsPerWeek')} | {pkg.visits_per_month}{' '}
                      {t('booking.visitsPerMonth')}
                    </span>
                    <span className="text-lg font-extrabold text-primary">
                      {parseFloat(pkg.price_omr).toFixed(2)} OMR
                    </span>
                    {active && (
                      <span className="absolute top-3 left-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3.5" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
    </div>
  )
}
