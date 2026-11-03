'use client'

import { useLanguage } from '@/components/language-provider'

export function IntroSection() {
  const { t } = useLanguage()

  return (
    <section id="about" className="scroll-mt-20 border-t border-border py-14 sm:py-20">
      <div className="site-container">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[var(--line)] bg-white px-6 py-8 shadow-[0_12px_40px_-24px_rgba(31,26,23,0.35)] sm:px-10 sm:py-11">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-brand-palm"
          />
          <div
            aria-hidden
            className="paper-grain pointer-events-none absolute inset-0 opacity-40"
          />

          <div className="relative text-start">
            <h2 className="font-ios text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
              {t('intro.title')}
            </h2>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-[var(--ink-soft)]">
              {t('intro.body')}
            </p>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-[var(--ink-muted)]">
              {t('intro.lead')}
            </p>
            <p className="mt-7 rounded-xl bg-[var(--paper-deep)] px-4 py-3.5 font-ios text-lg font-semibold leading-snug text-brand-palm sm:px-5 sm:text-xl">
              {t('intro.highlight')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
