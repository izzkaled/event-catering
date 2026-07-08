'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Clock, MapPin, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

export function Hero() {
  const { t, dir } = useLanguage()

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="pointer-events-none absolute -left-32 top-20 size-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 lg:grid-cols-2 lg:py-24">
        <div className={`flex flex-col gap-6 ${dir === 'rtl' ? 'text-center lg:text-right' : 'text-center lg:text-left'}`}>
          <span className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary lg:mx-0">
            <MapPin className="size-4" />
            {t('hero.badge')}
          </span>

          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Speedy Cleaning · نظافة بلس
            </p>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              {t('hero.title')}
            </h1>
          </div>

          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            {t('hero.subtitle')}. {t('hero.desc')}
          </p>

          <div className={`flex flex-col gap-3 sm:flex-row ${dir === 'rtl' ? 'sm:justify-center lg:justify-start' : 'sm:justify-center lg:justify-start'}`}>
            <Button
              render={<Link href="/booking" />}
              nativeButton={false}
              size="lg"
              className="h-12 px-8 text-base shadow-lg shadow-primary/20"
            >
              {t('hero.cta')}
            </Button>
            <Button
              render={<Link href="/#packages" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base"
            >
              {t('nav.services')}
            </Button>
          </div>

          <div className={`flex flex-wrap justify-center gap-4 lg:justify-start`}>
            {[
              { icon: ShieldCheck, label: t('hero.trust1') },
              { icon: Clock, label: t('hero.trust2') },
              { icon: UserCheck, label: t('hero.trust3') },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm"
              >
                <Icon className="size-4 text-accent" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="overflow-hidden rounded-3xl border border-border/80 shadow-2xl shadow-primary/10">
            <Image
              src="/images/hero-cleaning.png"
              alt={t('hero.imageAlt')}
              width={800}
              height={800}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
