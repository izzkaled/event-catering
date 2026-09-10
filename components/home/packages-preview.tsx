'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { PopularBadge } from '@/components/packages/popular-badge'
import { groupPackagesBySection, isPackagePopular, type PackageWithSection } from '@/lib/packages/types'
import { formatGuests, formatServiceHours } from '@/lib/packages/semantics'

export function PackagesPreview({ packages }: { packages: PackageWithSection[] }) {
  const { lang, t, dir } = useLanguage()
  const Arrow = dir === 'rtl' ? ChevronLeft : ChevronRight
  const sections = groupPackagesBySection(packages)

  if (!packages.length) return null

  return (
    <section id="packages" className="scroll-mt-20 border-t border-border bg-background py-16 sm:py-20">
      <div className="site-container">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className={dir === 'rtl' ? 'text-start' : 'text-start'}>
            <p className="brand-kicker mb-2">Packages</p>
            <h2 className="font-ios text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t('packages.title')}
            </h2>
            <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
              {t('packages.subtitle')}
            </p>
          </div>
          <Button
            render={<Link href="/booking" />}
            nativeButton={false}
            variant="outline"
            className="h-11 gap-1.5 rounded-full px-5 font-ios"
          >
            {t('packages.viewAll')}
            <Arrow className="size-4" strokeWidth={1.75} />
          </Button>
        </div>

        <div className="flex flex-col gap-14">
          {sections.map((section) => {
            const sectionName = lang === 'ar' ? section.name_ar : section.name_en
            const preview = section.packages.slice(0, 6)

            return (
              <div key={section.slug} className="flex flex-col gap-6">
                <h3 className="font-ios text-lg font-semibold tracking-tight text-foreground">
                  {sectionName}
                </h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {preview.map((pkg) => {
                    const name = lang === 'ar' ? pkg.name_ar : pkg.name_en
                    const popular = isPackagePopular(pkg)

                    return (
                      <Link
                        key={pkg.id}
                        href={`/booking?package=${pkg.id}`}
                        className="group relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-card/60 p-5 transition-all hover:border-brand-sand/50 hover:bg-card hover:shadow-[0_12px_40px_-24px_rgba(74,35,74,0.35)]"
                      >
                        {popular && <PopularBadge className="absolute -top-2.5 start-4" />}
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <h4 className="text-safe min-w-0 flex-1 font-ios text-base font-semibold leading-snug tracking-tight group-hover:text-primary">
                            {name}
                          </h4>
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                            <Users className="size-4" strokeWidth={1.75} />
                          </span>
                        </div>
                        <p className="font-ios text-sm text-muted-foreground">
                          {formatGuests(pkg.visits_per_week, lang)} · {formatServiceHours(pkg.hours_per_visit, lang)}
                        </p>
                        <div className="mt-auto flex items-end justify-between border-t border-border/70 pt-4">
                          <span className="font-ios text-xs text-muted-foreground">
                            {lang === 'ar' ? 'يبدأ من' : 'From'}
                          </span>
                          <span className="font-ios text-xl font-semibold tabular-nums text-primary">
                            {parseFloat(pkg.price_omr).toFixed(0)}{' '}
                            <span className="text-sm font-medium text-muted-foreground">OMR</span>
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
