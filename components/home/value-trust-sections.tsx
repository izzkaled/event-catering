'use client'

import { useLanguage } from '@/components/language-provider'
import { DramaticSection } from '@/components/home/dramatic-section'

export function ValueTrustSections() {
  const { t } = useLanguage()

  return (
    <>
      <DramaticSection id="value" variant="rise" className="bg-secondary/25">
        <div className="max-w-3xl text-start">
          <h2 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl">{t('value.title')}</h2>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-muted-foreground">{t('value.body')}</p>
          <p className="mt-8 font-ios text-xl font-semibold leading-snug text-brand-palm sm:text-2xl">
            {t('value.highlight')}
          </p>
        </div>
      </DramaticSection>

      <DramaticSection id="trust" variant="from-start">
        <div className="max-w-3xl text-start">
          <h2 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl">{t('trust.title')}</h2>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-muted-foreground">{t('trust.body')}</p>
        </div>
      </DramaticSection>
    </>
  )
}
