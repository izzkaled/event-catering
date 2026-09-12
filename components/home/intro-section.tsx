'use client'

import { useLanguage } from '@/components/language-provider'

export function IntroSection() {
  const { t } = useLanguage()

  return (
    <section id="about" className="scroll-mt-20 border-t border-border py-16 sm:py-20">
      <div className="site-container">
        <div className="mx-auto max-w-3xl text-start">
          <h2 className="font-ios text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('intro.title')}
          </h2>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-muted-foreground">{t('intro.body')}</p>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-muted-foreground">{t('intro.lead')}</p>
          <p className="mt-8 font-ios text-xl font-semibold leading-snug text-brand-palm sm:text-2xl">
            {t('intro.highlight')}
          </p>
        </div>
      </div>
    </section>
  )
}
