'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

export function AudienceSections() {
  const { t } = useLanguage()

  return (
    <>
      <section id="business" className="scroll-mt-20 border-t border-border py-16 sm:py-20">
        <div className="site-container">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-2xl text-start">
              <p className="brand-kicker mb-3">Business</p>
              <h2 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl">{t('business.title')}</h2>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-foreground">{t('business.body')}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ['business.flex', 'business.flexDesc'],
                ['business.org', 'business.orgDesc'],
                ['business.pro', 'business.proDesc'],
              ].map(([title, desc]) => (
                <div key={title}>
                  <h3 className="font-ios text-base font-semibold">{t(title as 'business.flex')}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(desc as 'business.flexDesc')}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10">
            <Button
              render={<Link href="/packages" />}
              nativeButton={false}
              variant="outline"
              className="h-11 rounded-full px-6 font-ios"
            >
              {t('business.cta')}
            </Button>
          </div>
        </div>
      </section>

      <section id="government" className="scroll-mt-20 border-t border-border bg-secondary/20 py-16 sm:py-20">
        <div className="site-container max-w-3xl text-start">
          <p className="brand-kicker mb-3">Government</p>
          <h2 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl">{t('government.title')}</h2>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-muted-foreground">{t('government.body')}</p>
          <Button
            render={<Link href="/packages" />}
            nativeButton={false}
            className="mt-8 h-11 rounded-full px-6 font-ios"
          >
            {t('government.cta')}
          </Button>
        </div>
      </section>

      <section id="individuals" className="scroll-mt-20 border-t border-border py-16 sm:py-20">
        <div className="site-container max-w-3xl text-start">
          <p className="brand-kicker mb-3">Individuals</p>
          <h2 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl">{t('individuals.title')}</h2>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-muted-foreground">{t('individuals.body')}</p>
          <Button
            render={<Link href="/experience/find" />}
            nativeButton={false}
            className="mt-8 h-11 rounded-full px-6 font-ios"
          >
            {t('individuals.cta')}
          </Button>
        </div>
      </section>
    </>
  )
}
