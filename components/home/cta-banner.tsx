'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

export function CtaBanner() {
  const { t } = useLanguage()

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 py-12 text-center text-primary-foreground shadow-xl sm:px-16">
          <div className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 size-56 rounded-full bg-white/10" />
          <div className="relative z-10 mx-auto max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t('cta.title')}</h2>
            <p className="mt-3 text-primary-foreground/90">{t('cta.subtitle')}</p>
            <Button
              render={<Link href="/booking" />}
              nativeButton={false}
              size="lg"
              className="mt-8 h-12 bg-white px-10 text-base font-bold text-primary hover:bg-white/90"
            >
              {t('cta.button')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
