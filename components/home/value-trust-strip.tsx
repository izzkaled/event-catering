'use client'

import { useLanguage } from '@/components/language-provider'

export function ValueTrustStrip() {
  const { t } = useLanguage()
  return (
    <section className="border-t border-brand-palm/10 bg-brand-cream py-12 sm:py-14">
      <div className="site-container grid gap-5 md:grid-cols-2 md:gap-6">
        <div
          id="value"
          className="scroll-mt-20 relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white px-6 py-7 shadow-[0_12px_40px_-24px_rgba(31,26,23,0.28)] sm:px-8 sm:py-8"
        >
          <div aria-hidden className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-brand-palm" />
          <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 opacity-35" />
          <div className="relative max-w-xl text-start">
            <h2 className="font-ios text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
              {t('value.title')}
            </h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-[var(--ink-soft)]">
              {t('value.body')}
            </p>
            <p className="mt-5 rounded-xl bg-[var(--paper-deep)] px-4 py-3 font-ios text-lg font-semibold leading-snug text-brand-palm">
              {t('value.highlight')}
            </p>
          </div>
        </div>

        <div
          id="trust"
          className="scroll-mt-20 relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white px-6 py-7 shadow-[0_12px_40px_-24px_rgba(31,26,23,0.28)] sm:px-8 sm:py-8"
        >
          <div aria-hidden className="pointer-events-none absolute inset-y-0 start-0 w-1.5 bg-brand-sand" />
          <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 opacity-35" />
          <div className="relative max-w-xl text-start">
            <h2 className="font-ios text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
              {t('trust.title')}
            </h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-[var(--ink-soft)]">
              {t('trust.body')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
