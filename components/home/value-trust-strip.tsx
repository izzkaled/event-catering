'use client'

import { useLanguage } from '@/components/language-provider'

export function ValueTrustStrip() {
  const { t } = useLanguage()
  return (
    <section className="border-t border-brand-palm/10 bg-[#f3eee6] py-12 sm:py-14">
      <div className="site-container grid gap-10 md:grid-cols-2">
        <div id="value" className="scroll-mt-20 max-w-xl text-start">
          <h2 className="font-ios text-2xl font-semibold tracking-tight text-brand-palm sm:text-3xl">
            {t('value.title')}
          </h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground">{t('value.body')}</p>
          <p className="mt-5 font-ios text-lg font-semibold leading-snug text-brand-palm">
            {t('value.highlight')}
          </p>
        </div>
        <div id="trust" className="scroll-mt-20 max-w-xl text-start">
          <h2 className="font-ios text-2xl font-semibold tracking-tight text-brand-palm sm:text-3xl">
            {t('trust.title')}
          </h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground">{t('trust.body')}</p>
        </div>
      </div>
    </section>
  )
}
