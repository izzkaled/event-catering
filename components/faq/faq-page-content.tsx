'use client'

import Link from 'next/link'
import { FaqSection } from '@/components/home/faq-section'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

export function FaqPageContent() {
  const { lang, t } = useLanguage()
  const isAr = lang === 'ar'

  return (
    <>
      <div className="border-b border-[var(--line)] bg-[var(--paper-deep)]/55">
        <div className="site-container py-10 text-center sm:py-14">
          <p className="text-sm font-semibold tracking-wide text-brand-sand">
            Event Catering · {isAr ? 'عُمان' : 'Oman'}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-palm sm:text-4xl">
            {t('faq.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--ink-muted)]">
            {t('faq.subtitle')}
          </p>
        </div>
      </div>

      <FaqSection hideHeading className="bg-background" />

      <div className="site-container pb-14 text-center">
        <Button
          render={<Link href="/packages" />}
          nativeButton={false}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isAr ? 'تصفح الباقات' : 'Browse packages'}
        </Button>
      </div>
    </>
  )
}
