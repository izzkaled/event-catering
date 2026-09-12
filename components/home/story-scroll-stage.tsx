'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { TranslationKey } from '@/lib/i18n'

type SlideId = 'custom' | 'business' | 'government' | 'individuals' | 'value' | 'trust'

type Slide = {
  id: SlideId
  kicker: string | null
  titleKey: TranslationKey
  bodyKey: TranslationKey
  highlightKey?: TranslationKey
  ctaKey?: TranslationKey
  ctaHref?: string
  points?: { titleKey: TranslationKey; descKey: TranslationKey }[]
  tone: 'plain' | 'soft'
}

const SLIDES: Slide[] = [
  {
    id: 'custom',
    kicker: 'Custom',
    titleKey: 'custom.title',
    bodyKey: 'custom.body',
    ctaKey: 'custom.cta',
    ctaHref: '/experience/find',
    tone: 'soft',
    points: [
      { titleKey: 'custom.guests', descKey: 'custom.guestsDesc' },
      { titleKey: 'custom.venue', descKey: 'custom.venueDesc' },
      { titleKey: 'custom.services', descKey: 'custom.servicesDesc' },
      { titleKey: 'custom.budget', descKey: 'custom.budgetDesc' },
    ],
  },
  {
    id: 'business',
    kicker: 'Business',
    titleKey: 'business.title',
    bodyKey: 'business.body',
    ctaKey: 'business.cta',
    ctaHref: '/packages',
    tone: 'plain',
    points: [
      { titleKey: 'business.flex', descKey: 'business.flexDesc' },
      { titleKey: 'business.org', descKey: 'business.orgDesc' },
      { titleKey: 'business.pro', descKey: 'business.proDesc' },
    ],
  },
  {
    id: 'government',
    kicker: 'Government',
    titleKey: 'government.title',
    bodyKey: 'government.body',
    ctaKey: 'government.cta',
    ctaHref: '/packages',
    tone: 'soft',
  },
  {
    id: 'individuals',
    kicker: 'Individuals',
    titleKey: 'individuals.title',
    bodyKey: 'individuals.body',
    ctaKey: 'individuals.cta',
    ctaHref: '/experience/find',
    tone: 'plain',
  },
  {
    id: 'value',
    kicker: null,
    titleKey: 'value.title',
    bodyKey: 'value.body',
    highlightKey: 'value.highlight',
    tone: 'soft',
  },
  {
    id: 'trust',
    kicker: null,
    titleKey: 'trust.title',
    bodyKey: 'trust.body',
    tone: 'plain',
  },
]

const SEGMENT_VH = 92

export function StoryScrollStage() {
  const { t, lang, dir } = useLanguage()
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dirDelta, setDirDelta] = useState<1 | -1>(1)
  const lastIndex = useRef(0)
  const reduceMotion = useRef(false)

  const labels = useMemo(
    () =>
      SLIDES.map((s) => ({
        id: s.id,
        label: s.kicker || (lang === 'ar'
          ? s.id === 'value'
            ? 'القيمة'
            : 'الثقة'
          : s.id === 'value'
            ? 'Value'
            : 'Trust'),
      })),
    [lang],
  )

  const syncFromScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const trackTop = window.scrollY + rect.top
    const scrollable = Math.max(1, track.offsetHeight - window.innerHeight)
    const raw = (window.scrollY - trackTop) / scrollable
    const p = Math.min(1, Math.max(0, raw))
    const next = Math.min(SLIDES.length - 1, Math.floor(p * SLIDES.length + 1e-6))
    setProgress(p)
    if (next !== lastIndex.current) {
      setDirDelta(next > lastIndex.current ? 1 : -1)
      lastIndex.current = next
      setIndex(next)
    }
  }, [])

  useEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    syncFromScroll()
    window.addEventListener('scroll', syncFromScroll, { passive: true })
    window.addEventListener('resize', syncFromScroll)
    return () => {
      window.removeEventListener('scroll', syncFromScroll)
      window.removeEventListener('resize', syncFromScroll)
    }
  }, [syncFromScroll])

  // Deep-link: #business etc. scroll into the matching segment
  useEffect(() => {
    const jump = () => {
      const hash = window.location.hash.replace('#', '') as SlideId
      const i = SLIDES.findIndex((s) => s.id === hash)
      if (i < 0 || !trackRef.current) return
      const trackTop = trackRef.current.getBoundingClientRect().top + window.scrollY
      const scrollable = Math.max(1, trackRef.current.offsetHeight - window.innerHeight)
      const target = trackTop + ((i + 0.15) / SLIDES.length) * scrollable
      window.scrollTo({ top: target, behavior: reduceMotion.current ? 'auto' : 'smooth' })
    }
    jump()
    window.addEventListener('hashchange', jump)
    return () => window.removeEventListener('hashchange', jump)
  }, [])

  const goTo = (i: number) => {
    const track = trackRef.current
    if (!track) return
    const trackTop = track.getBoundingClientRect().top + window.scrollY
    const scrollable = Math.max(1, track.offsetHeight - window.innerHeight)
    const target = trackTop + ((i + 0.2) / SLIDES.length) * scrollable
    window.scrollTo({ top: target, behavior: reduceMotion.current ? 'auto' : 'smooth' })
  }

  const active = SLIDES[index]!
  const fill = ((index + 0.5) / SLIDES.length) * 100

  return (
    <div
      ref={trackRef}
      id="story"
      className="relative"
      style={{ height: `${SLIDES.length * SEGMENT_VH}vh` }}
    >
      <div
        className={cn(
          'sticky top-0 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden border-t border-border/60',
          active.tone === 'soft' ? 'bg-secondary/30' : 'bg-background',
        )}
      >
        {/* Progress rail */}
        <div className="pointer-events-none absolute inset-y-0 start-0 z-20 hidden w-px bg-brand-sand/20 md:block">
          <div
            className="absolute inset-x-0 top-0 w-px bg-gradient-to-b from-brand-palm via-brand-sand to-brand-palm transition-[height] duration-500 ease-out"
            style={{ height: `${Math.min(100, Math.max(8, progress * 100))}%` }}
          />
        </div>

        <div className="site-container relative flex min-h-0 flex-1 flex-col py-6 sm:py-8 lg:py-10">
          <div className="mb-4 flex items-center justify-between gap-4 sm:mb-6">
            <p className="font-ios text-[0.65rem] font-medium uppercase tracking-[0.28em] text-brand-sand">
              {lang === 'ar' ? 'تعرّف علينا' : 'Discover'}
            </p>
            <p className="font-ios text-xs tabular-nums text-muted-foreground" dir="ltr">
              {String(index + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
            </p>
          </div>

          <div className="relative min-h-0 flex-1">
            {SLIDES.map((slide, i) => {
              const isActive = i === index
              const offset =
                reduceMotion.current || isActive
                  ? 0
                  : (i < index ? -1 : 1) * dirDelta * (dir === 'rtl' ? -1 : 1)

              return (
                <article
                  key={slide.id}
                  id={slide.id}
                  aria-hidden={!isActive}
                  className={cn(
                    'absolute inset-0 flex flex-col justify-center overflow-y-auto overscroll-contain pr-1',
                    'transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    isActive
                      ? 'pointer-events-auto z-10 opacity-100 blur-0'
                      : 'pointer-events-none z-0 opacity-0 blur-[2px]',
                  )}
                  style={{
                    transform: isActive
                      ? 'translate3d(0,0,0) scale(1)'
                      : `translate3d(0, ${offset * 48}px, 0) scale(0.985)`,
                  }}
                >
                  <div className="max-w-3xl text-start">
                    {slide.kicker ? <p className="brand-kicker mb-3">{slide.kicker}</p> : null}
                    <h2 className="text-balance font-ios text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.65rem]">
                      {t(slide.titleKey)}
                    </h2>
                    <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">
                      {t(slide.bodyKey)}
                    </p>
                    {slide.highlightKey ? (
                      <p className="mt-8 font-ios text-xl font-semibold leading-snug text-brand-palm sm:text-2xl">
                        {t(slide.highlightKey)}
                      </p>
                    ) : null}
                  </div>

                  {slide.points ? (
                    <ul
                      className={cn(
                        'mt-10 grid gap-6',
                        slide.points.length > 3 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3',
                      )}
                    >
                      {slide.points.map((point, pi) => (
                        <li
                          key={point.titleKey}
                          className="border-s-2 border-brand-sand/50 ps-4 transition-all duration-500"
                          style={{
                            transitionDelay: isActive ? `${120 + pi * 70}ms` : '0ms',
                            opacity: isActive ? 1 : 0,
                            transform: isActive ? 'translateY(0)' : 'translateY(12px)',
                          }}
                        >
                          <h3 className="font-ios text-base font-semibold tracking-tight">
                            {t(point.titleKey)}
                          </h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {t(point.descKey)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {slide.ctaKey && slide.ctaHref ? (
                    <div className="mt-10">
                      <Button
                        render={<Link href={slide.ctaHref} />}
                        nativeButton={false}
                        size="lg"
                        variant={slide.id === 'business' ? 'outline' : 'default'}
                        className="h-11 rounded-full px-7 font-ios sm:h-12 sm:px-8"
                      >
                        {t(slide.ctaKey)}
                      </Button>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>

          {/* Segment navigator */}
          <nav
            className="mt-4 flex shrink-0 flex-col gap-3 sm:mt-6"
            aria-label={lang === 'ar' ? 'أقسام القصة' : 'Story sections'}
          >
            <div className="h-0.5 overflow-hidden rounded-full bg-brand-sand/20">
              <div
                className="h-full rounded-full bg-brand-palm transition-[width] duration-500 ease-out"
                style={{ width: `${fill}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {labels.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    'rounded-full px-3 py-1.5 font-ios text-[11px] font-medium tracking-wide transition-all sm:text-xs',
                    i === index
                      ? 'bg-brand-palm text-brand-cream shadow-sm'
                      : 'bg-transparent text-muted-foreground hover:bg-brand-sand/15 hover:text-brand-palm',
                  )}
                  aria-current={i === index ? 'true' : undefined}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              {lang === 'ar' ? 'مرّر للأعلى أو الأسفل للتنقل بين الأقسام' : 'Scroll up or down to move between sections'}
            </p>
          </nav>
        </div>
      </div>
    </div>
  )
}
