'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { DramaticSection, DramaStagger } from '@/components/home/dramatic-section'

const fields = [
  { titleKey: 'custom.guests' as const, descKey: 'custom.guestsDesc' as const },
  { titleKey: 'custom.venue' as const, descKey: 'custom.venueDesc' as const },
  { titleKey: 'custom.services' as const, descKey: 'custom.servicesDesc' as const },
  { titleKey: 'custom.budget' as const, descKey: 'custom.budgetDesc' as const },
]

export function CustomExperience() {
  const { t } = useLanguage()

  return (
    <DramaticSection id="custom" variant="rise" className="bg-secondary/20">
      <div className="max-w-2xl text-start">
        <p className="brand-kicker mb-3">Custom</p>
        <h2 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl">{t('custom.title')}</h2>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-muted-foreground">{t('custom.body')}</p>
      </div>

      <DramaStagger className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4" stepMs={110}>
        {fields.map((field) => (
          <div key={field.titleKey} className="border-s-2 border-brand-sand/50 ps-4">
            <h3 className="font-ios text-base font-semibold tracking-tight">{t(field.titleKey)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(field.descKey)}</p>
          </div>
        ))}
      </DramaStagger>

      <div className="mt-12">
        <Button
          render={<Link href="/experience/find" />}
          nativeButton={false}
          size="lg"
          className="h-12 rounded-full px-8 font-ios tracking-wide"
        >
          {t('custom.cta')}
        </Button>
      </div>
    </DramaticSection>
  )
}
