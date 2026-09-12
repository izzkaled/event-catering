'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

const fields = [
  { titleKey: 'custom.guests' as const, descKey: 'custom.guestsDesc' as const },
  { titleKey: 'custom.venue' as const, descKey: 'custom.venueDesc' as const },
  { titleKey: 'custom.services' as const, descKey: 'custom.servicesDesc' as const },
  { titleKey: 'custom.budget' as const, descKey: 'custom.budgetDesc' as const },
]

export function CustomExperience() {
  const { t } = useLanguage()

  return (
    <section id="custom" className="scroll-mt-20 border-t border-brand-palm/8 py-10 sm:py-12">
      <div className="site-container">
        <div className="max-w-2xl text-start">
          <p className="brand-kicker mb-2">Custom</p>
          <h2 className="font-ios text-2xl font-semibold tracking-tight sm:text-3xl">{t('custom.title')}</h2>
          <p className="mt-2 text-[1.02rem] leading-relaxed text-muted-foreground">{t('custom.body')}</p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((field) => (
            <div key={field.titleKey} className="border-s-2 border-brand-sand/50 ps-4">
              <h3 className="font-ios text-base font-semibold tracking-tight">{t(field.titleKey)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(field.descKey)}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Button
            render={<Link href="/experience/find" />}
            nativeButton={false}
            size="lg"
            className="h-11 rounded-full px-7 font-ios tracking-wide"
          >
            {t('custom.cta')}
          </Button>
        </div>
      </div>
    </section>
  )
}
