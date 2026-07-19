'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { PopularBadge } from '@/components/packages/popular-badge'
import { groupPackagesBySection, isPackagePopular, type PackageWithSection } from '@/lib/packages/types'

export function PackagesPreview({ packages }: { packages: PackageWithSection[] }) {
  const { lang, t, dir } = useLanguage()
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight
  const sections = groupPackagesBySection(packages)

  if (!packages.length) return null

  return (
    <section id="packages" className="scroll-mt-20 border-t border-border bg-background py-16">
      <div className="site-container">
        <div className="mb-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-end">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t('packages.title')}</h2>
            <p className="mt-2 text-muted-foreground">{t('packages.subtitle')}</p>
          </div>
          <Button render={<Link href="/booking" />} nativeButton={false} variant="outline">
            {t('packages.viewAll')}
            <Arrow className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-12">
          {sections.map((section) => {
            const sectionName = lang === 'ar' ? section.name_ar : section.name_en
            const preview = section.packages.slice(0, 6)

            return (
              <div key={section.slug} className="flex flex-col gap-5">
                <h3 className="text-lg font-bold text-foreground">{sectionName}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {preview.map((pkg) => {
                    const name = lang === 'ar' ? pkg.name_ar : pkg.name_en
                    const popular = isPackagePopular(pkg)

                    return (
                      <Link
                        key={pkg.id}
                        href="/booking"
                        className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                      >
                        {popular && (
                          <PopularBadge className="absolute -top-2.5 start-4" />
                        )}
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <h4 className="text-safe min-w-0 flex-1 font-bold leading-snug group-hover:text-primary">
                            {name}
                          </h4>
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Sparkles className="size-4" />
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pkg.hours_per_visit} {t('booking.hours')} · {pkg.visits_per_week}{' '}
                          {t('booking.visitsPerWeek')}
                        </p>
                        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
                          <span className="text-xs text-muted-foreground">
                            {pkg.visits_per_month} {t('booking.visitsPerMonth')}
                          </span>
                          <span className="text-xl font-extrabold text-primary">
                            {parseFloat(pkg.price_omr).toFixed(0)}{' '}
                            <span className="text-sm font-semibold">OMR</span>
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
