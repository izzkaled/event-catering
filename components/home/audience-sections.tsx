'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

export function AudienceSections() {
  const { t } = useLanguage()

  return (
    <>
      <section id="business" className="scroll-mt-20 border-t border-brand-palm/8 py-10 sm:py-12">
        <div className="site-container">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-2xl text-start">
              <p className="brand-kicker mb-2">Business</p>
              <h2 className="font-ios text-2xl font-semibold tracking-tight sm:text-3xl">{t('business.title')}</h2>
              <p className="mt-3 text-[1.02rem] leading-relaxed text-muted-foreground">{t('business.body')}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ['business.flex', 'business.flexDesc'],
                ['business.org', 'business.orgDesc'],
                ['business.pro', 'business.proDesc'],
              ].map(([title, desc]) => (
                <div key={title}>
                  <h3 className="font-ios text-base font-semibold">{t(title as 'business.flex')}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(desc as 'business.flexDesc')}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <Button
              render={<Link href="/packages" />}
              nativeButton={false}
              variant="outline"
              className="h-10 rounded-full px-6 font-ios"
            >
              {t('business.cta')}
            </Button>
          </div>
        </div>
      </section>

      <section id="government" className="scroll-mt-20 border-t border-brand-palm/8 py-10 sm:py-12">
        <div className="site-container max-w-3xl text-start">
          <p className="brand-kicker mb-2">Government</p>
          <h2 className="font-ios text-2xl font-semibold tracking-tight sm:text-3xl">{t('government.title')}</h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground">{t('government.body')}</p>
          <Button
            render={<Link href="/packages" />}
            nativeButton={false}
            className="mt-6 h-10 rounded-full px-6 font-ios"
          >
            {t('government.cta')}
          </Button>
        </div>
      </section>

      <section id="individuals" className="scroll-mt-20 border-t border-brand-palm/8 py-10 sm:py-12">
        <div className="site-container max-w-3xl text-start">
          <p className="brand-kicker mb-2">Individuals</p>
          <h2 className="font-ios text-2xl font-semibold tracking-tight sm:text-3xl">{t('individuals.title')}</h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground">{t('individuals.body')}</p>
          <Button
            render={<Link href="/experience/find" />}
            nativeButton={false}
            className="mt-6 h-10 rounded-full px-6 font-ios"
          >
            {t('individuals.cta')}
          </Button>
        </div>
      </section>
    </>
  )
}
