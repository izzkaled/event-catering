'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

export function CtaBanner() {
  const { t } = useLanguage()

  return (
    <section className="border-t border-border">
      <div className="site-container py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-[clamp(1rem,5vw,4rem)] py-10 text-center text-primary-foreground shadow-xl sm:py-12">
          <div className="pointer-events-none absolute -start-10 -top-10 size-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -end-10 -bottom-10 size-56 rounded-full bg-white/10" />
          <div className="relative z-10 mx-auto w-full max-w-[min(36rem,92vw)]">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">{t('cta.title')}</h2>
            <p className="mt-3 text-sm text-primary-foreground/90 sm:text-base">{t('cta.subtitle')}</p>
            <Button
              render={<Link href="/booking" />}
              nativeButton={false}
              size="lg"
              className="mt-6 h-12 w-full bg-white px-10 text-base font-bold text-primary hover:bg-white/90 sm:mt-8 sm:w-auto"
            >
              {t('cta.button')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
