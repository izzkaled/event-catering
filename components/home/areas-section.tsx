'use client'

import { MapPin } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { MUSCAT_AREAS, MUSCAT_AREAS_EN } from '@/lib/constants'

export function AreasSection() {
  const { lang, t } = useLanguage()
  const areas = lang === 'ar' ? MUSCAT_AREAS : MUSCAT_AREAS_EN

  return (
    <section className="border-t border-border bg-primary/5 py-14">
      <div className="site-container text-center">
        <div className="content-max mb-8">
          <h2 className="text-2xl font-extrabold sm:text-3xl">{t('areas.title')}</h2>
          <p className="mt-2 text-muted-foreground">{t('areas.subtitle')}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {areas.map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-2 text-sm font-medium shadow-sm"
            >
              <MapPin className="size-3.5 text-primary" />
              {area}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
