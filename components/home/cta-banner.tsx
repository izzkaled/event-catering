'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { useLanguage } from '@/components/language-provider'

export function CtaBanner() {
  const { t } = useLanguage()

  return (
    <section className="border-t border-border">
      <div className="site-container py-16 sm:py-20">
        <div className="surface-brand relative overflow-hidden rounded-[1.75rem] px-[clamp(1rem,5vw,4rem)] py-12 text-center text-brand-cream shadow-[0_24px_60px_-28px_rgba(74,35,74,0.55)] sm:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,color-mix(in_srgb,var(--brand-sand)_18%,transparent),transparent_45%)]" />
          <div className="relative z-10 mx-auto flex w-full max-w-[min(36rem,92vw)] flex-col items-center">
            <BrandLogo size="lg" full variant="onDark" className="mb-5 justify-center" />
            <h2 className="font-brand text-3xl font-medium tracking-wide sm:text-4xl md:text-[2.6rem]">
              {t('cta.title')}
            </h2>
            <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-brand-cream/88 sm:text-base">
              {t('cta.subtitle')}
            </p>
            <Button
              render={<Link href="/booking" />}
              nativeButton={false}
              size="lg"
              className="btn-luxury mt-8 h-12 w-full px-10 text-[0.95rem] tracking-wide sm:w-auto"
            >
              {t('cta.button')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
