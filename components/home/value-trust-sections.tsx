'use client'

import { useLanguage } from '@/components/language-provider'

export function ValueTrustSections() {
  const { t } = useLanguage()

  return (
    <>
      <section id="value" className="scroll-mt-20 border-t border-border bg-secondary/25 py-16 sm:py-20">
        <div className="site-container max-w-3xl text-start">
          <h2 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl">{t('value.title')}</h2>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-muted-foreground">{t('value.body')}</p>
          <p className="mt-8 font-ios text-xl font-semibold leading-snug text-brand-palm sm:text-2xl">
            {t('value.highlight')}
          </p>
        </div>
      </section>

      <section id="trust" className="scroll-mt-20 border-t border-border py-16 sm:py-20">
        <div className="site-container max-w-3xl text-start">
          <h2 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl">{t('trust.title')}</h2>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-muted-foreground">{t('trust.body')}</p>
        </div>
      </section>
    </>
  )
}
