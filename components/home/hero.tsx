'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

const HERO_POSTER = '/images/brand/brand-table.webp'
const HERO_VIDEO = '/videos/hero-catering.mp4'

export function Hero() {
  const { t, dir, lang } = useLanguage()
  const isRtl = dir === 'rtl'
  const Chevron = isRtl ? ChevronLeft : ChevronRight
  const videoRef = useRef<HTMLVideoElement>(null)
  const [canPlayVideo, setCanPlayVideo] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const video = videoRef.current
    if (!video) return

    let cancelled = false

    const tryPlay = async () => {
      try {
        video.muted = true
        await video.play()
        if (!cancelled) setCanPlayVideo(true)
      } catch {
        // Autoplay blocked — keep poster image.
      }
    }

    // Defer decode until after first paint for faster initial load.
    let idleHandle = 0
    let usedIdleCallback = false
    if (typeof window.requestIdleCallback === 'function') {
      usedIdleCallback = true
      idleHandle = window.requestIdleCallback(() => void tryPlay(), { timeout: 900 })
    } else {
      idleHandle = window.setTimeout(() => void tryPlay(), 120)
    }

    return () => {
      cancelled = true
      if (usedIdleCallback) window.cancelIdleCallback(idleHandle)
      else window.clearTimeout(idleHandle)
    }
  }, [])

  return (
    <section className="relative min-h-[min(100svh,52rem)] overflow-hidden">
      {/* Instant LCP poster */}
      <Image
        src={HERO_POSTER}
        alt={t('hero.imageAlt')}
        fill
        priority
        className={cn(
          'object-cover object-[68%_center] transition-opacity duration-700 sm:object-center',
          canPlayVideo ? 'opacity-0' : 'opacity-100',
        )}
        sizes="100vw"
      />

      {/* Short looped brand video — muted, inline, no controls */}
      <video
        ref={videoRef}
        className={cn(
          'absolute inset-0 h-full w-full object-cover object-[68%_center] transition-opacity duration-700 sm:object-center',
          canPlayVideo ? 'opacity-100' : 'opacity-0',
        )}
        poster={HERO_POSTER}
        muted
        playsInline
        loop
        preload="metadata"
        aria-hidden
        tabIndex={-1}
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>

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
              className="w-full gap-2 bg-brand-sand text-[var(--ink)] shadow-sm hover:bg-brand-sand/90 sm:w-auto"
            >
              {t('hero.cta')}
              <Chevron className="size-[1.125rem]" strokeWidth={1.75} />
            </Button>
            <Button
              render={<Link href="/experience/find" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 sm:w-auto"
            >
              {t('hero.ctaSecondary')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
