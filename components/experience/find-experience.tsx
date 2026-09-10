'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/components/language-provider'
import { BUDGET_BANDS, OCCASION_OPTIONS } from '@/lib/experience/filters'
import { reasonLabel, recommendPackages } from '@/lib/experience/recommend'
import type { BudgetBand, ExperiencePackage, OccasionType } from '@/lib/experience/types'
import { cn } from '@/lib/utils'

export function FindExperience({
  experiencePackages,
}: {
  experiencePackages: ExperiencePackage[]
}) {
  const { lang } = useLanguage()
  const [occasion, setOccasion] = useState<OccasionType | null>(null)
  const [guests, setGuests] = useState(75)
  const [budget, setBudget] = useState<BudgetBand | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const results = useMemo(() => {
    if (!submitted) return []
    return recommendPackages({
      packages: experiencePackages,
      occasion,
      guests,
      budget,
      limit: 3,
    })
  }, [submitted, experiencePackages, occasion, guests, budget])

  return (
    <div className="site-container py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <p className="brand-kicker mb-3">Guide</p>
        <h1 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl">
          {lang === 'ar' ? 'اعثر على تجربتك' : 'Find My Experience'}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {lang === 'ar'
            ? 'التوصيات تُحسب من كل الباقات المنشورة في قاعدة البيانات — أي باقة جديدة تدخل تلقائيًا.'
            : 'Recommendations are computed from every published package in the database — new packages are included automatically.'}
        </p>

        <div className="mt-8 space-y-6 rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
          <div>
            <p className="mb-3 font-ios font-semibold">
              {lang === 'ar' ? 'نوع المناسبة' : 'Occasion type'}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {OCCASION_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOccasion(o.id)}
                  className={cn(
                    'rounded-xl border px-4 py-3 text-start text-sm font-medium',
                    occasion === o.id
                      ? 'border-brand-sand bg-brand-sand/15 text-brand-palm'
                      : 'border-border',
                  )}
                >
                  {lang === 'ar' ? o.ar : o.en}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="g">{lang === 'ar' ? 'كم ضيفًا تتوقع؟' : 'How many guests?'}</Label>
            <Input
              id="g"
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value) || 1)}
              className="mt-2 h-11 max-w-xs"
            />
          </div>

          <div>
            <p className="mb-3 font-ios font-semibold">
              {lang === 'ar' ? 'الميزانية التقريبية' : 'Approximate budget'}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {BUDGET_BANDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBudget(b.id)}
                  className={cn(
                    'rounded-xl border px-4 py-3 text-start text-sm font-medium',
                    budget === b.id
                      ? 'border-brand-sand bg-brand-sand/15 text-brand-palm'
                      : 'border-border',
                  )}
                >
                  {lang === 'ar' ? b.ar : b.en}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            className="h-11 w-full rounded-full font-ios sm:w-auto sm:px-8"
            onClick={() => setSubmitted(true)}
          >
            {lang === 'ar' ? 'اعرض التوصيات' : 'Show recommendations'}
          </Button>
        </div>

        {submitted && (
          <div className="mt-10 space-y-6">
            <h2 className="font-ios text-2xl font-semibold">
              {lang === 'ar' ? 'موصى بها لك' : 'Recommended for you'}
            </h2>
            {!results.length && (
              <p className="text-muted-foreground">
                {lang === 'ar'
                  ? 'لا توجد باقات منشورة مطابقة حاليًا.'
                  : 'No matching published packages yet.'}
              </p>
            )}
            {results.map(({ pkg, reasons }) => (
              <div key={pkg.id} className="rounded-2xl border border-border p-5">
                <h3 className="font-ios text-xl font-semibold">
                  {lang === 'ar' ? pkg.name_ar : pkg.name_en}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lang === 'ar' ? pkg.description_ar : pkg.description_en}
                </p>
                <p className="mt-4 text-sm font-semibold">
                  {lang === 'ar' ? 'لماذا هذه الباقة؟' : 'Why this package?'}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {reasons.map((r) => (
                    <li key={r}>· {reasonLabel(r, lang)}</li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    render={<Link href={`/packages/${pkg.slug}`} />}
                    nativeButton={false}
                    className="rounded-full"
                  >
                    {lang === 'ar' ? 'خصص التجربة' : 'Customize Experience'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
