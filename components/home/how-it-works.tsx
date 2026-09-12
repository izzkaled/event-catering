'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Package, Settings2, Sparkles, type LucideIcon } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

const steps: { icon: LucideIcon; titleKey: 'how.1.title' | 'how.2.title' | 'how.3.title' | 'how.4.title'; descKey: 'how.1.desc' | 'how.2.desc' | 'how.3.desc' | 'how.4.desc' }[] = [
  { icon: MessageSquare, titleKey: 'how.1.title', descKey: 'how.1.desc' },
  { icon: Package, titleKey: 'how.2.title', descKey: 'how.2.desc' },
  { icon: Settings2, titleKey: 'how.3.title', descKey: 'how.3.desc' },
  { icon: Sparkles, titleKey: 'how.4.title', descKey: 'how.4.desc' },
]

export function HowItWorks() {
  const { t, dir, lang } = useLanguage()
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true)
          io.disconnect()
        }
      },
      { threshold: 0.22, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="how"
      className="scroll-mt-20 border-t border-border/60 py-16 sm:py-20 lg:py-24"
    >
      <div className="site-container">
        <div className="max-w-2xl text-start">
          <p className="brand-kicker mb-3">How it works</p>
          <h2 className="text-balance font-ios text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('how.title')}
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{t('how.subtitle')}</p>
        </div>

        {/* Mobile / tablet: vertical map path */}
        <ol
          className={cn(
            'relative mt-12 space-y-0 md:hidden',
            active && 'how-map-active',
          )}
          aria-label={lang === 'ar' ? 'مسار الخطوات' : 'Step path'}
        >
          <div
            className="how-map-rail absolute top-3 bottom-3 w-[2px] bg-brand-sand/25"
            style={{ insetInlineStart: '1.375rem' }}
            aria-hidden
          >
            <div className="how-map-rail-fill absolute inset-x-0 top-0 w-full origin-top bg-gradient-to-b from-brand-palm via-brand-sand to-brand-palm" />
          </div>

          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <li
                key={step.titleKey}
                className="how-map-stop relative flex gap-4 pb-10 last:pb-0"
                style={{ animationDelay: `${180 + i * 160}ms` }}
              >
                <div className="relative z-10 shrink-0">
                  <span className="how-map-node relative flex size-12 items-center justify-center rounded-full border border-brand-sand/40 bg-[#fffcf8] text-brand-palm shadow-[0_8px_20px_-12px_rgba(74,35,74,0.45)]">
                    <Icon className="size-5" strokeWidth={1.75} />
                    <span className="absolute -top-1 -end-1 flex size-5 items-center justify-center rounded-full bg-brand-palm font-ios text-[10px] font-semibold text-brand-cream">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </span>
                </div>
                <div className="min-w-0 pt-1.5 text-start">
                  <h3 className="font-ios text-base font-semibold tracking-tight text-brand-palm">
                    {t(step.titleKey)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(step.descKey)}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

        {/* Desktop: horizontal route map */}
        <div
          className={cn(
            'relative mt-16 hidden md:block',
            active && 'how-map-active',
          )}
        >
          <svg
            className="pointer-events-none absolute inset-x-[6%] top-[1.75rem] h-10 w-[88%]"
            viewBox="0 0 1000 40"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d={
                dir === 'rtl'
                  ? 'M980 20 C820 20, 780 6, 660 20 S500 34, 340 20 S180 6, 20 20'
                  : 'M20 20 C180 20, 220 6, 340 20 S500 34, 660 20 S820 6, 980 20'
              }
              className="how-map-route-base"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d={
                dir === 'rtl'
                  ? 'M980 20 C820 20, 780 6, 660 20 S500 34, 340 20 S180 6, 20 20'
                  : 'M20 20 C180 20, 220 6, 340 20 S500 34, 660 20 S820 6, 980 20'
              }
              className="how-map-route-draw"
              stroke="url(#howRouteGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient
                id="howRouteGrad"
                x1={dir === 'rtl' ? '100%' : '0%'}
                y1="0%"
                x2={dir === 'rtl' ? '0%' : '100%'}
                y2="0%"
              >
                <stop offset="0%" stopColor="#4A234A" />
                <stop offset="50%" stopColor="#C9A86C" />
                <stop offset="100%" stopColor="#4A234A" />
              </linearGradient>
            </defs>
          </svg>

          {/* Animated traveler along the route */}
          <div className="how-map-traveler pointer-events-none absolute top-[1.35rem] size-3 rounded-full bg-brand-sand shadow-[0_0_0_4px_rgba(201,168,108,0.25)]" aria-hidden />

          <ol className="grid grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <li
                  key={step.titleKey}
                  className="how-map-stop relative flex flex-col items-center gap-4 text-center"
                  style={{ animationDelay: `${220 + i * 180}ms` }}
                >
                  <span className="how-map-node relative z-10 flex size-14 items-center justify-center rounded-full border border-brand-sand/40 bg-[#fffcf8] text-brand-palm shadow-[0_10px_24px_-12px_rgba(74,35,74,0.5)]">
                    <Icon className="size-6" strokeWidth={1.75} />
                    <span className="absolute -top-1 -end-1 flex size-6 items-center justify-center rounded-full bg-brand-palm font-ios text-[11px] font-semibold text-brand-cream">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </span>
                  <div className="max-w-[16rem]">
                    <h3 className="font-ios text-base font-semibold tracking-tight text-brand-palm lg:text-lg">
                      {t(step.titleKey)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(step.descKey)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
