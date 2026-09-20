'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export function StoryZoomSection() {
  const { t, lang } = useLanguage()
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const zoomLayerRefs = useRef<(HTMLDivElement | null)[]>([])
  const panelLayerRefs = useRef<(HTMLDivElement | null)[]>([])
  const articleRefs = useRef<(HTMLElement | null)[]>([])
  const lastIndex = useRef(0)
  const [index, setIndex] = useState(0)
  const prefs = useRef({ narrow: false, reduceMotion: false, segmentVh: 155, zoomStrength: 0.28 })

  useEffect(() => {
    const narrowMq = window.matchMedia('(max-width: 767px)')
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyPrefs = () => {
      const narrow = narrowMq.matches
      prefs.current = {
        narrow,
        reduceMotion: motionMq.matches,
        segmentVh: narrow ? 110 : 155,
        zoomStrength: narrow ? 0.12 : 0.24,
      }
      if (trackRef.current) {
        trackRef.current.style.height = `${PANELS.length * prefs.current.segmentVh}vh`
      }
    }
    applyPrefs()
    narrowMq.addEventListener('change', applyPrefs)
    motionMq.addEventListener('change', applyPrefs)
    return () => {
      narrowMq.removeEventListener('change', applyPrefs)
      motionMq.removeEventListener('change', applyPrefs)
    }
  }, [])

  useEffect(() => {
    let raf = 0
    let ticking = false

    const paint = () => {
      ticking = false
      const track = trackRef.current
      if (!track) return

      const { reduceMotion, zoomStrength } = prefs.current
      const rect = track.getBoundingClientRect()
      const top = window.scrollY + rect.top
      const scrollable = Math.max(1, track.offsetHeight - window.innerHeight)
      const p = Math.min(1, Math.max(0, (window.scrollY - top) / scrollable))
      const next = Math.min(PANELS.length - 1, Math.floor(p * PANELS.length + 1e-4))
      const local = (p * PANELS.length) % 1
      const eased = easeOutCubic(Math.min(1, Math.max(0, local)))
      const zoom = reduceMotion ? 1.03 : 1 + eased * zoomStrength
      const fill = ((next + Math.min(1, local + 0.12)) / PANELS.length) * 100

      // Direct DOM — no React re-render on scroll
      const zoomEl = zoomLayerRefs.current[next]
      if (zoomEl) zoomEl.style.transform = `scale3d(${zoom}, ${zoom}, 1)`
      if (fillRef.current) fillRef.current.style.width = `${fill}%`

      if (next !== lastIndex.current) {
        const prev = lastIndex.current
        lastIndex.current = next

        const prevZoom = zoomLayerRefs.current[prev]
        if (prevZoom) {
          prevZoom.style.transform = 'scale3d(1.06, 1.06, 1)'
          prevZoom.style.willChange = 'auto'
        }
        if (zoomEl) zoomEl.style.willChange = 'transform'

        panelLayerRefs.current.forEach((el, i) => {
          if (!el) return
          el.style.opacity = i === next ? '1' : '0'
        })
        articleRefs.current.forEach((el, i) => {
          if (!el) return
          const on = i === next
          el.style.opacity = on ? '1' : '0'
          el.style.transform = on ? 'translate3d(0,0,0)' : 'translate3d(0,12px,0)'
          el.style.pointerEvents = on ? 'auto' : 'none'
          el.setAttribute('aria-hidden', on ? 'false' : 'true')
        })

        setIndex(next)
      }
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      raf = requestAnimationFrame(paint)
    }

    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

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

  const labels = useMemo(
    () => PANELS.map((p) => ({ id: p.id, label: p.kicker })),
    [],
  )

  return (
    <div
      ref={trackRef}
      id="story"
      className="relative bg-[#2a122a]"
      style={{ height: `${PANELS.length * 155}vh` }}
    >
      <div
        className={cn(
          // Sit under the sticky site header so the cream bar doesn't cut the image
          'sticky top-14 sm:top-[4.25rem] z-30 flex flex-col overflow-hidden overscroll-y-contain touch-pan-y bg-[#2a122a]',
          'h-[calc(100svh-3.5rem)] max-h-[calc(100svh-3.5rem)] sm:h-[calc(100svh-4.25rem)] sm:max-h-[calc(100svh-4.25rem)]',
          // keep copy above the mobile bottom nav
          'pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-0',
        )}
      >
        <div className="absolute inset-0 overflow-hidden contain-paint">
          {PANELS.map((panel, i) => (
            <div
              key={panel.id}
              ref={(el) => {
                panelLayerRefs.current[i] = el
              }}
              className="absolute inset-0 overflow-hidden"
              style={{
                opacity: i === 0 ? 1 : 0,
                transition: 'opacity 280ms ease-out',
              }}
              aria-hidden={i !== 0}
            >
              <div
                ref={(el) => {
                  zoomLayerRefs.current[i] = el
                }}
                className="absolute inset-[-6%] origin-center backface-hidden"
                style={{
                  transform: 'scale3d(1.06, 1.06, 1)',
                  willChange: i === 0 ? 'transform' : 'auto',
                }}
              >
                <Image
                  src={panel.image}
                  alt=""
                  fill
                  priority={i === 0}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  sizes="100vw"
                  quality={70}
                  draggable={false}
                  className="pointer-events-none select-none object-cover"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#2a122a]/60 via-[#2a122a]/15 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-linear-to-t from-[#2a122a]/72 via-[#2a122a]/25 to-transparent" />
            </div>
          ))}
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="site-container flex min-h-0 flex-1 flex-col py-4 sm:py-8">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3 sm:mb-4">
              <p className="font-ios text-[0.65rem] font-medium uppercase tracking-[0.28em] text-[#c9a86c]">
                {lang === 'ar' ? 'لمن نقدّم' : 'Who we serve'}
              </p>
              <p className="font-ios text-xs tabular-nums text-white/70" dir="ltr">
                {String(index + 1).padStart(2, '0')} / {String(PANELS.length).padStart(2, '0')}
              </p>
            </div>

            <div className="relative min-h-0 flex-1">
              {PANELS.map((panel, i) => (
                <article
                  key={panel.id}
                  id={panel.id}
                  ref={(el) => {
                    articleRefs.current[i] = el
                  }}
                  aria-hidden={i !== 0}
                  className="absolute inset-0 flex flex-col justify-end"
                  style={{
                    opacity: i === 0 ? 1 : 0,
                    transform: i === 0 ? 'translate3d(0,0,0)' : 'translate3d(0,12px,0)',
                    pointerEvents: i === 0 ? 'auto' : 'none',
                    transition: 'opacity 280ms ease, transform 280ms ease',
                  }}
                >
                  <div className="max-w-2xl text-start text-white">
                    <p className="mb-1.5 font-ios text-[0.65rem] font-medium uppercase tracking-[0.28em] text-[#e0c48a] sm:mb-2 sm:text-[0.7rem]">
                      {panel.kicker}
                    </p>
                    <h2 className="text-balance font-ios text-[1.7rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
                      {t(panel.titleKey)}
                    </h2>
                    <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-white/90 sm:mt-3 sm:text-[1.02rem]">
                      {t(panel.bodyKey)}
                    </p>
                  </div>

                  {panel.points ? (
                    <ul
                      className={cn(
                        'mt-3 hidden gap-2.5 sm:mt-6 sm:grid sm:gap-4',
                        panel.points.length > 3
                          ? 'sm:grid-cols-2 lg:grid-cols-4'
                          : 'sm:grid-cols-3',
                      )}
                    >
                      {panel.points.map((point) => (
                        <li
                          key={point.titleKey}
                          className="border-s-2 border-[#c9a86c]/80 bg-[#2a122a]/40 ps-2.5 py-1.5 sm:ps-3 sm:py-2"
                        >
                          <h3 className="font-ios text-xs font-semibold text-white sm:text-sm">
                            {t(point.titleKey)}
                          </h3>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-white/80 sm:mt-1 sm:text-xs">
                            {t(point.descKey)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-4 sm:mt-6">
                    <Button
                      render={<Link href={panel.ctaHref} />}
                      nativeButton={false}
                      className="h-11 rounded-full bg-[#c9a86c] px-7 font-ios text-[#2a122a] hover:bg-[#d4b57a]"
                    >
                      {t(panel.ctaKey)}
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <nav
              className="mt-3 shrink-0 sm:mt-4"
              aria-label={lang === 'ar' ? 'أقسام القصة' : 'Story panels'}
            >
              <div className="mb-2.5 h-0.5 overflow-hidden rounded-full bg-white/20 sm:mb-3">
                <div
                  ref={fillRef}
                  className="h-full rounded-full bg-[#c9a86c]"
                  style={{ width: `${100 / PANELS.length}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {labels.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={cn(
                      'rounded-full px-2.5 py-1 font-ios text-[10px] font-medium tracking-wide transition-colors sm:px-3 sm:py-1.5 sm:text-xs',
                      i === index
                        ? 'bg-white text-[#4a234a]'
                        : 'bg-white/10 text-white/80 active:bg-white/20',
                    )}
                    aria-current={i === index ? 'true' : undefined}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-white/55 sm:text-[11px]">
                {lang === 'ar' ? 'مرّر للتنقل بين الأقسام' : 'Scroll to move between panels'}
              </p>
            </nav>
          </div>
        </div>
      </div>
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
