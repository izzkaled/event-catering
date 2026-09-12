'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { DramaticSection, DramaStagger } from '@/components/home/dramatic-section'

export function AudienceSections() {
  const { t } = useLanguage()

  return (
    <>
      <DramaticSection
        id="business"
        variant="from-start"
        className="border-t border-brand-palm/8 py-10 sm:py-12"
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-2xl text-start">
            <p className="brand-kicker mb-2">Business</p>
            <h2 className="font-ios text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('business.title')}
            </h2>
            <p className="mt-3 text-[1.02rem] leading-relaxed text-muted-foreground">
              {t('business.body')}
            </p>
          </div>
          <DramaStagger className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1" stepMs={110}>
            {(
              [
                ['business.flex', 'business.flexDesc'],
                ['business.org', 'business.orgDesc'],
                ['business.pro', 'business.proDesc'],
              ] as const
            ).map(([title, desc]) => (
              <div key={title}>
                <h3 className="font-ios text-base font-semibold">{t(title)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(desc)}</p>
              </div>
            ))}
          </DramaStagger>
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
      </DramaticSection>

      <DramaticSection
        id="government"
        variant="from-end"
        className="border-t border-brand-palm/8 py-10 sm:py-12"
      >
        <div className="max-w-3xl text-start">
          <p className="brand-kicker mb-2">Government</p>
          <h2 className="font-ios text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('government.title')}
          </h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground">
            {t('government.body')}
          </p>
          <Button
            render={<Link href="/packages" />}
            nativeButton={false}
            className="mt-6 h-10 rounded-full px-6 font-ios"
          >
            {t('government.cta')}
          </Button>
        </div>
      </DramaticSection>

      <DramaticSection
        id="individuals"
        variant="zoom"
        className="border-t border-brand-palm/8 py-10 sm:py-12"
      >
        <div className="max-w-3xl text-start">
          <p className="brand-kicker mb-2">Individuals</p>
          <h2 className="font-ios text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('individuals.title')}
          </h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground">
            {t('individuals.body')}
          </p>
          <Button
            render={<Link href="/experience/find" />}
            nativeButton={false}
            className="mt-6 h-10 rounded-full px-6 font-ios"
          >
            {t('individuals.cta')}
          </Button>
        </div>
      </DramaticSection>
    </>
  )
}
