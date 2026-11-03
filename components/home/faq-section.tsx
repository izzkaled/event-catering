'use client'

import { ChevronDown } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { SEO_FAQS } from '@/lib/seo-faq'
import { cn } from '@/lib/utils'

type FaqSectionProps = {
  /** Hide the section title block (when the page already has an H1). */
  hideHeading?: boolean
  className?: string
}

export function FaqSection({ hideHeading = false, className }: FaqSectionProps) {
  const { lang, t } = useLanguage()

  return (
    <section id="faq" className={cn('py-10 sm:py-14', className)}>
      <div className="site-container">
        {!hideHeading && (
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold text-[var(--ink)] sm:text-3xl">
              {t('faq.title')}
            </h2>
            <p className="mt-2 text-[var(--ink-muted)]">{t('faq.subtitle')}</p>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-3">
          {SEO_FAQS.map((item) => {
            const q = lang === 'ar' ? item.questionAr : item.questionEn
            const a = lang === 'ar' ? item.answerAr : item.answerEn
            return (
              <details
                key={item.questionEn}
                className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_10px_28px_-22px_rgba(31,26,23,0.35)] open:shadow-[0_14px_36px_-20px_rgba(31,26,23,0.4)]"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-start marker:content-none sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                  <span className="text-base font-bold leading-snug text-brand-palm sm:text-[1.05rem]">
                    {q}
                  </span>
                  <ChevronDown
                    aria-hidden
                    className="mt-0.5 size-5 shrink-0 text-[var(--ink-muted)] transition-transform duration-200 group-open:rotate-180"
                    strokeWidth={2}
                  />
                </summary>
                <div className="border-t border-[var(--line)] bg-[var(--paper-deep)]/45 px-5 py-4 sm:px-6 sm:py-5">
                  <p className="text-sm leading-relaxed text-[var(--ink-soft)] sm:text-[0.95rem]">
                    {a}
                  </p>
                </div>
              </details>
            )
          })}
        </div>
      </div>
    </section>
  )
}
