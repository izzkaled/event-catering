'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Clock, MapPin, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { useLanguage } from '@/components/language-provider'

export function Hero() {
  const { t, dir, lang } = useLanguage()

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 glow-sand" />
      <div className="pointer-events-none absolute -start-28 top-24 size-[28rem] rounded-full bg-brand-sand/15 blur-3xl" />
      <div className="pointer-events-none absolute -end-24 bottom-0 size-80 rounded-full bg-brand-palm/10 blur-3xl" />

      <div className="site-container relative grid items-center gap-8 py-10 sm:gap-10 sm:py-14 lg:grid-cols-2 lg:gap-12 lg:py-24">
        <div
          className={`flex flex-col gap-5 sm:gap-6 ${dir === 'rtl' ? 'text-center lg:text-end' : 'text-center lg:text-start'}`}
        >
          <div className={`mx-auto lg:mx-0 ${dir === 'rtl' ? 'lg:ms-auto lg:me-0' : ''}`}>
            <BrandLogo size="xl" className="justify-center lg:justify-start" />
          </div>

          <span className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-brand-sand/40 bg-brand-sand/10 px-3 py-1.5 text-xs font-semibold text-brand-palm sm:px-4 sm:text-sm lg:mx-0">
            <MapPin className="size-4 text-brand-terracotta" />
            {t('hero.badge')}
          </span>

          <div className="space-y-3">
            <p className="brand-kicker">KHOUSA · OMAN</p>
            <h1 className="text-balance text-2xl font-bold leading-snug tracking-tight text-brand-palm sm:text-3xl lg:text-4xl">
              {t('hero.title')}
            </h1>
          </div>

          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('hero.subtitle')}. {t('hero.desc')}
          </p>

          <div
            className={`flex flex-col gap-3 sm:flex-row ${dir === 'rtl' ? 'sm:justify-center lg:justify-start' : 'sm:justify-center lg:justify-start'}`}
          >
            <Button
              render={<Link href="/booking" />}
              nativeButton={false}
              size="lg"
              className="h-12 w-full bg-brand-palm px-8 text-base text-brand-cream shadow-lg shadow-brand-palm/25 hover:bg-brand-palm/90 sm:w-auto"
            >
              {t('hero.cta')}
            </Button>
            <Button
              render={<Link href="/#packages" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-12 w-full border-brand-sand/50 bg-brand-sand/10 px-8 text-base text-brand-palm hover:bg-brand-sand/20 sm:w-auto"
            >
              {t('nav.services')}
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible lg:justify-start [&::-webkit-scrollbar]:hidden">
            {[
              { icon: ShieldCheck, label: t('hero.trust1') },
              { icon: Clock, label: t('hero.trust2') },
              { icon: UserCheck, label: t('hero.trust3') },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex shrink-0 items-center gap-1.5 border-b border-brand-sand/40 px-1 py-1.5 text-xs text-muted-foreground sm:gap-2 sm:px-2 sm:text-sm"
              >
                <Icon className="size-3.5 text-brand-terracotta sm:size-4" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[min(28rem,90vw)] lg:max-w-none">
          <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-[linear-gradient(145deg,var(--brand-palm),var(--brand-sand),var(--brand-terracotta))] opacity-20 blur-sm" />
          <div className="overflow-hidden rounded-3xl border border-brand-sand/35 shadow-2xl shadow-brand-palm/15">
            <Image
              src="/images/hero-cleaning.png"
              alt={t('hero.imageAlt')}
              width={800}
              height={800}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
          <p className="mt-3 text-center text-xs font-medium tracking-wide text-muted-foreground lg:text-start">
            {lang === 'ar' ? 'خوصة · عُمان' : 'KHOUSA · Oman'}
          </p>
        </div>
      </div>
    </section>
  )
}
