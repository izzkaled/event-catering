'use client'

import { useLanguage } from '@/components/language-provider'

export function ValueTrustSections() {
  const { t } = useLanguage()

  return (
    <>
      <section id="value" className="scroll-mt-20 border-t border-brand-palm/8 py-10 sm:py-12">
        <div className="site-container max-w-3xl text-start">
          <h2 className="font-ios text-2xl font-semibold tracking-tight sm:text-3xl">{t('value.title')}</h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground">{t('value.body')}</p>
          <p className="mt-6 font-ios text-lg font-semibold leading-snug text-brand-palm sm:text-xl">
            {t('value.highlight')}
          </p>
        </div>
      </section>

      <section id="trust" className="scroll-mt-20 border-t border-brand-palm/8 py-10 sm:py-12">
        <div className="site-container max-w-3xl text-start">
          <h2 className="font-ios text-2xl font-semibold tracking-tight sm:text-3xl">{t('trust.title')}</h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground">{t('trust.body')}</p>
        </div>
      </section>
    </>
  )
}
