'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'
import { SEO_FAQS } from '@/lib/seo-faq'

export function FaqSection({ limit }: { limit?: number }) {
  const { lang, t } = useLanguage()
  const items = typeof limit === 'number' ? SEO_FAQS.slice(0, limit) : SEO_FAQS

  return (
    <section id="faq" className="border-t border-border bg-background py-14">
      <div className="site-container">
        <div className="content-max mb-8 text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">{t('faq.title')}</h2>
          <p className="mt-2 text-muted-foreground">{t('faq.subtitle')}</p>
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
          {items.map((item) => {
            const q = lang === 'ar' ? item.questionAr : item.questionEn
            const a = lang === 'ar' ? item.answerAr : item.answerEn
            return (
              <details key={item.questionEn} className="group py-4">
                <summary className="cursor-pointer list-none pe-6 text-start text-base font-bold text-brand-palm marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-3">
                    {q}
                    <span
                      aria-hidden
                      className="mt-0.5 shrink-0 text-brand-sand transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            )
          })}
        </div>

        {typeof limit === 'number' && (
          <p className="mt-6 text-center text-sm">
            <Link href="/faq" className="font-semibold text-brand-terracotta hover:underline">
              {t('faq.viewAll')}
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
