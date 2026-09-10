'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

export function Hero() {
  const { t, dir, lang } = useLanguage()
  const isRtl = dir === 'rtl'
  const Chevron = isRtl ? ChevronLeft : ChevronRight

  return (
    <section className="relative min-h-[min(100svh,52rem)] overflow-hidden">
      <Image
        src="/images/brand/brand-table.webp"
        alt={t('hero.imageAlt')}
        fill
        priority
        className="object-cover object-[68%_center] sm:object-center"
        sizes="100vw"
      />

      <div
        className={cn(
          'pointer-events-none absolute inset-0',
          isRtl
            ? 'bg-[linear-gradient(270deg,rgba(28,12,28,0.78)_0%,rgba(42,18,42,0.52)_34%,rgba(42,18,42,0.14)_62%,transparent_82%)]'
            : 'bg-[linear-gradient(90deg,rgba(28,12,28,0.78)_0%,rgba(42,18,42,0.52)_34%,rgba(42,18,42,0.14)_62%,transparent_82%)]',
        )}
      />

      <div className="site-container relative flex min-h-[min(100svh,52rem)] items-end pb-16 pt-28 sm:pb-20 sm:pt-32 lg:items-center lg:pb-28 lg:pt-28">
        <div className="w-full max-w-xl space-y-6 text-start sm:space-y-7">
          <p className="animate-[fade-up_0.7s_ease-out_both] font-ios text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[#c9a86c] sm:text-xs">
            {t('hero.eyebrow')}
          </p>

          <h1
            className={cn(
              'animate-[fade-up_0.75s_ease-out_0.04s_both] text-balance font-ios text-[2.05rem] font-semibold leading-[1.2]',
              'text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]',
              'sm:text-[2.7rem] lg:text-[3.15rem]',
              lang === 'ar' ? 'tracking-normal' : 'tracking-[-0.025em]',
            )}
          >
            {t('hero.title')}
          </h1>

          <p className="animate-[fade-up_0.75s_ease-out_0.08s_both] max-w-lg text-[0.98rem] leading-relaxed text-white/88 sm:text-[1.05rem]">
            {t('hero.desc')}
          </p>

          <div className="flex animate-[fade-up_0.75s_ease-out_0.12s_both] flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
            <Button
              render={<Link href="/packages" />}
              nativeButton={false}
              size="lg"
              className="h-12 min-h-12 w-full gap-1.5 rounded-full border-0 bg-[#c9a86c] px-8 font-ios text-[0.95rem] font-semibold text-[#2a122a] shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] transition hover:bg-[#d4b57a] active:scale-[0.98] sm:w-auto"
            >
              {t('hero.cta')}
              <Chevron className="size-[1.125rem]" strokeWidth={1.75} />
            </Button>
            <Button
              render={<Link href="/experience/find" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-12 min-h-12 w-full rounded-full border-white/55 bg-white/10 px-8 font-ios text-[0.95rem] font-medium text-white backdrop-blur-md transition hover:border-white/80 hover:bg-white/18 active:scale-[0.98] sm:w-auto"
            >
              {t('hero.ctaSecondary')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
