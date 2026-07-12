'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Sparkles, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/language-provider'
import type { Package } from '@/lib/db/schema'

export function PackagesPreview({ packages }: { packages: Package[] }) {
  const { lang, t, dir } = useLanguage()
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight

  const preview = packages.slice(0, 6)

  if (!preview.length) return null

  return (
    <section id="packages" className="scroll-mt-20 border-t border-border bg-background py-16">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-right">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t('packages.title')}</h2>
            <p className="mt-2 text-muted-foreground">{t('packages.subtitle')}</p>
          </div>
          <Button render={<Link href="/booking" />} nativeButton={false} variant="outline">
            {t('packages.viewAll')}
            <Arrow className="size-4" />
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((pkg) => {
            const name = lang === 'ar' ? pkg.name_ar : pkg.name_en
            return (
              <Link
                key={pkg.id}
                href="/booking"
                className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                {pkg.is_featured && (
                  <Badge className="absolute -top-2.5 start-4 gap-1 bg-primary text-primary-foreground">
                    <Star className="size-3 fill-current" />
                    {t('booking.featured')}
                  </Badge>
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold leading-snug group-hover:text-primary">{name}</h3>
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
                    {parseFloat(pkg.price_omr).toFixed(0)} <span className="text-sm font-semibold">OMR</span>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
