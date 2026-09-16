'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { TranslationKey } from '@/lib/i18n'

type PanelId = 'custom' | 'business' | 'government' | 'individuals'

type Panel = {
  id: PanelId
  kicker: string
  image: string
  titleKey: TranslationKey
  bodyKey: TranslationKey
  ctaKey: TranslationKey
  ctaHref: string
  points?: { titleKey: TranslationKey; descKey: TranslationKey }[]
}

const PANELS: Panel[] = [
  {
    id: 'custom',
    kicker: 'Custom',
    image: '/images/brand/story/custom.webp',
    titleKey: 'custom.title',
    bodyKey: 'custom.body',
    ctaKey: 'custom.cta',
    ctaHref: '/experience/find',
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
    image: '/images/brand/story/business.webp',
    titleKey: 'business.title',
    bodyKey: 'business.body',
    ctaKey: 'business.cta',
    ctaHref: '/packages',
    points: [
      { titleKey: 'business.flex', descKey: 'business.flexDesc' },
      { titleKey: 'business.org', descKey: 'business.orgDesc' },
      { titleKey: 'business.pro', descKey: 'business.proDesc' },
    ],
  },
  {
    id: 'government',
    kicker: 'Government',
    image: '/images/brand/story/government.webp',
    titleKey: 'government.title',
    bodyKey: 'government.body',
    ctaKey: 'government.cta',
    ctaHref: '/packages',
  },
  {
    id: 'individuals',
    kicker: 'Individuals',
    image: '/images/brand/story/individuals.webp',
    titleKey: 'individuals.title',
    bodyKey: 'individuals.body',
    ctaKey: 'individuals.cta',
    ctaHref: '/experience/find',
  },
]

const SEGMENT_VH = 100

/**
 * One sticky stage: scroll drives zoom-in on brand imagery + panel swap.
 * No blur on text — panels stay readable; image zooms behind.
 */
export function StoryZoomSection() {
  const { t, lang } = useLanguage()
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const lastIndex = useRef(0)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const sync = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const top = window.scrollY + rect.top
    const scrollable = Math.max(1, track.offsetHeight - window.innerHeight)
    const p = Math.min(1, Math.max(0, (window.scrollY - top) / scrollable))
    const next = Math.min(PANELS.length - 1, Math.floor(p * PANELS.length + 1e-4))
    setProgress(p)
    if (next !== lastIndex.current) {
      lastIndex.current = next
      setIndex(next)
    }
  }, [])

  useEffect(() => {
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [sync])

  useEffect(() => {
    const jump = () => {
      const hash = window.location.hash.replace('#', '')
      const i = PANELS.findIndex((p) => p.id === hash)
      if (i < 0 || !trackRef.current) return
      const top = trackRef.current.getBoundingClientRect().top + window.scrollY
      const scrollable = Math.max(1, trackRef.current.offsetHeight - window.innerHeight)
      window.scrollTo({ top: top + ((i + 0.2) / PANELS.length) * scrollable, behavior: 'smooth' })
    }
    jump()
    window.addEventListener('hashchange', jump)
    return () => window.removeEventListener('hashchange', jump)
  }, [])

  const goTo = (i: number) => {
    const track = trackRef.current
    if (!track) return
    const top = track.getBoundingClientRect().top + window.scrollY
    const scrollable = Math.max(1, track.offsetHeight - window.innerHeight)
    window.scrollTo({ top: top + ((i + 0.2) / PANELS.length) * scrollable, behavior: 'smooth' })
  }

  const local = (progress * PANELS.length) % 1
  const zoom = reduceMotion ? 1.04 : 1 + local * 0.18
  const fill = ((index + Math.min(1, local + 0.15)) / PANELS.length) * 100

  const labels = useMemo(
    () => PANELS.map((p) => ({ id: p.id, label: p.kicker })),
    [],
  )

  return (
    <div
      ref={trackRef}
      id="story"
      className="relative bg-[#f3eee6]"
      style={{ height: `${PANELS.length * SEGMENT_VH}vh` }}
    >
      <div className="sticky top-0 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
        {/* Full-bleed image stage with scroll zoom */}
        <div className="absolute inset-0">
          {PANELS.map((panel, i) => (
            <div
              key={panel.id}
              className={cn(
                'absolute inset-0 transition-opacity duration-700 ease-out',
                i === index ? 'opacity-100' : 'opacity-0',
              )}
              aria-hidden={i !== index}
            >
              <div
                className="absolute inset-0 will-change-transform"
                style={{
                  transform: i === index ? `scale(${zoom})` : 'scale(1.05)',
                  transition: i === index ? 'none' : 'transform 0.6s ease',
                }}
              >
                <Image
                  src={panel.image}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a122a]/88 via-[#2a122a]/45 to-[#2a122a]/25" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,108,0.18),transparent_55%)]" />
            </div>
          ))}
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="site-container flex min-h-0 flex-1 flex-col py-6 sm:py-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-ios text-[0.65rem] font-medium uppercase tracking-[0.28em] text-[#c9a86c]">
                {lang === 'ar' ? 'لمن نقدّم' : 'Who we serve'}
              </p>
              <p className="font-ios text-xs tabular-nums text-white/70" dir="ltr">
                {String(index + 1).padStart(2, '0')} / {String(PANELS.length).padStart(2, '0')}
              </p>
            </div>

            <div className="relative min-h-0 flex-1">
              {PANELS.map((panel, i) => {
                const on = i === index
                return (
                  <article
                    key={panel.id}
                    id={panel.id}
                    aria-hidden={!on}
                    className={cn(
                      'absolute inset-0 flex flex-col justify-end overflow-y-auto pb-2 transition-all duration-500 ease-out',
                      on
                        ? 'pointer-events-auto translate-y-0 opacity-100'
                        : 'pointer-events-none translate-y-4 opacity-0',
                    )}
                  >
                    <div className="max-w-2xl text-start text-white">
                      <p className="mb-2 font-ios text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[#c9a86c]">
                        {panel.kicker}
                      </p>
                      <h2 className="text-balance font-ios text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.6rem]">
                        {t(panel.titleKey)}
                      </h2>
                      <p className="mt-3 max-w-xl text-[1.02rem] leading-relaxed text-white/85">
                        {t(panel.bodyKey)}
                      </p>
                    </div>

                    {panel.points ? (
                      <ul
                        className={cn(
                          'mt-6 grid gap-4',
                          panel.points.length > 3 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3',
                        )}
                      >
                        {panel.points.map((point) => (
                          <li
                            key={point.titleKey}
                            className="border-s-2 border-[#c9a86c]/70 bg-black/20 ps-3 py-2 backdrop-blur-[2px]"
                          >
                            <h3 className="font-ios text-sm font-semibold text-white">
                              {t(point.titleKey)}
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-white/75">
                              {t(point.descKey)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-6">
                      <Button
                        render={<Link href={panel.ctaHref} />}
                        nativeButton={false}
                        className="h-11 rounded-full bg-[#c9a86c] px-7 font-ios text-[#2a122a] hover:bg-[#d4b57a]"
                      >
                        {t(panel.ctaKey)}
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>

            <nav className="mt-4 shrink-0" aria-label={lang === 'ar' ? 'أقسام القصة' : 'Story panels'}>
              <div className="mb-3 h-0.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-[#c9a86c] transition-[width] duration-300 ease-out"
                  style={{ width: `${fill}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {labels.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={cn(
                      'rounded-full px-3 py-1.5 font-ios text-[11px] font-medium tracking-wide transition-colors sm:text-xs',
                      i === index
                        ? 'bg-white text-[#4a234a]'
                        : 'bg-white/10 text-white/80 hover:bg-white/20',
                    )}
                    aria-current={i === index ? 'true' : undefined}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-white/55">
                {lang === 'ar' ? 'مرّر للتكبير والتنقل بين الأقسام' : 'Scroll to zoom and move between panels'}
              </p>
            </nav>
          </div>
        </div>
      </div>

      {/* Keep value/trust as compact readable strip after the zoom stage ends */}
    </div>
  )
}

export function ValueTrustStrip() {
  const { t } = useLanguage()
  return (
    <section className="border-t border-brand-palm/10 bg-[#f3eee6] py-12 sm:py-14">
      <div className="site-container grid gap-10 md:grid-cols-2">
        <div id="value" className="scroll-mt-20 max-w-xl text-start">
          <h2 className="font-ios text-2xl font-semibold tracking-tight text-brand-palm sm:text-3xl">
            {t('value.title')}
          </h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground">{t('value.body')}</p>
          <p className="mt-5 font-ios text-lg font-semibold leading-snug text-brand-palm">
            {t('value.highlight')}
          </p>
        </div>
        <div id="trust" className="scroll-mt-20 max-w-xl text-start">
          <h2 className="font-ios text-2xl font-semibold tracking-tight text-brand-palm sm:text-3xl">
            {t('trust.title')}
          </h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground">{t('trust.body')}</p>
        </div>
      </div>
    </section>
  )
}
