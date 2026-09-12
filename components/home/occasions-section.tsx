'use client'

import { Building2, Landmark, PartyPopper, Users } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { DramaticSection, DramaStagger } from '@/components/home/dramatic-section'

const items = [
  { icon: Landmark, titleKey: 'occasions.gov.title' as const, descKey: 'occasions.gov.desc' as const },
  { icon: Building2, titleKey: 'occasions.corp.title' as const, descKey: 'occasions.corp.desc' as const },
  { icon: PartyPopper, titleKey: 'occasions.private.title' as const, descKey: 'occasions.private.desc' as const },
  { icon: Users, titleKey: 'occasions.large.title' as const, descKey: 'occasions.large.desc' as const },
]

export function OccasionsSection() {
  const { t } = useLanguage()

  return (
    <DramaticSection id="occasions" variant="from-end" className="bg-secondary/25" stage={false}>
      <div className="mb-12 max-w-2xl text-start">
        <p className="brand-kicker mb-3">Occasions</p>
        <h2 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl">{t('occasions.title')}</h2>
      </div>

      <DramaStagger className="grid gap-10 sm:grid-cols-2" stepMs={100}>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.titleKey}
              className="flex gap-4 border-b border-border/70 pb-8 last:border-0 sm:last:border-b"
            >
              <span className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-sand/30 bg-brand-sand/10 text-brand-palm">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="font-ios text-lg font-semibold tracking-tight">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                  {t(item.descKey)}
                </p>
              </div>
            </div>
          )
        })}
      </DramaStagger>
    </DramaticSection>
  )
}
