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

      {/* Light-to-medium veil on text side only — keeps photo open on the other side */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0',
          isRtl
            ? 'bg-[linear-gradient(270deg,rgba(28,12,28,0.72)_0%,rgba(42,18,42,0.45)_32%,rgba(42,18,42,0.12)_58%,transparent_78%)]'
            : 'bg-[linear-gradient(90deg,rgba(28,12,28,0.72)_0%,rgba(42,18,42,0.45)_32%,rgba(42,18,42,0.12)_58%,transparent_78%)]',
        )}
      />

      <div className="site-container relative flex min-h-[min(100svh,52rem)] items-end pb-16 pt-28 sm:pb-20 sm:pt-32 lg:items-center lg:pb-28 lg:pt-28">
        <div
          className={cn(
            'w-full max-w-lg space-y-8',
            isRtl ? 'ms-0 me-auto text-start' : 'ms-0 me-auto text-start',
          )}
        >
          <h1
            className={cn(
              'animate-[fade-up_0.75s_ease-out_both] text-balance font-ios text-[2.15rem] font-semibold leading-[1.18]',
              'text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]',
              'sm:text-[2.85rem] lg:text-[3.25rem]',
              lang === 'ar' ? 'tracking-normal' : 'tracking-[-0.025em]',
            )}
          >
            {t('hero.title')}
          </h1>

          <div className="flex animate-[fade-up_0.75s_ease-out_0.12s_both] flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
            <Button
              render={<Link href="/booking" />}
              nativeButton={false}
              size="lg"
              className="h-12 min-h-12 w-full gap-1.5 rounded-full border-0 bg-[#c9a86c] px-8 font-ios text-[0.95rem] font-semibold text-[#2a122a] shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] transition hover:bg-[#d4b57a] active:scale-[0.98] sm:w-auto"
            >
              {t('hero.cta')}
              <Chevron className="size-[1.125rem]" strokeWidth={1.75} />
            </Button>
            <Button
              render={<Link href="/#packages" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-12 min-h-12 w-full rounded-full border-white/55 bg-white/10 px-8 font-ios text-[0.95rem] font-medium text-white backdrop-blur-md transition hover:border-white/80 hover:bg-white/18 active:scale-[0.98] sm:w-auto"
            >
              {t('nav.packages')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
