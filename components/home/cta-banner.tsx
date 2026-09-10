'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { useLanguage } from '@/components/language-provider'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'

export function CtaBanner() {
  const { t } = useLanguage()

  return (
    <section id="contact" className="scroll-mt-20 border-t border-border">
      <div className="site-container py-16 sm:py-20">
        <div className="surface-brand relative overflow-hidden rounded-[1.75rem] px-[clamp(1rem,5vw,4rem)] py-12 text-center text-brand-cream shadow-[0_24px_60px_-28px_rgba(74,35,74,0.55)] sm:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,color-mix(in_srgb,var(--brand-sand)_18%,transparent),transparent_45%)]" />
          <div className="relative z-10 mx-auto flex w-full max-w-[min(40rem,92vw)] flex-col items-center">
            <BrandLogo size="lg" full variant="onDark" className="mb-5 justify-center" />
            <h2 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.6rem]">
              {t('cta.title')}
            </h2>
            <p className="mt-3 max-w-md font-ios text-lg font-medium text-brand-cream/95 sm:text-xl">
              {t('cta.subtitle')}
            </p>
            <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-brand-cream/85 sm:text-base">
              {t('cta.body')}
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
              render={<Link href="/packages" />}
              nativeButton={false}
              size="lg"
              className="btn-luxury h-12 w-full px-8 text-[0.95rem] tracking-wide sm:w-auto"
            >
              {t('cta.button')}
            </Button>
              <Button
                render={
                  <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" />
                }
                nativeButton={false}
                size="lg"
                className="btn-ghost-luxury h-12 w-full px-8 text-[0.95rem] sm:w-auto"
              >
                {t('cta.secondary')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
