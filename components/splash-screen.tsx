'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Cormorant_Garamond } from 'next/font/google'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'

const DURATION_MS = 2400
const SESSION_KEY = 'ec-splash-seen'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

function isAuthRoute(pathname: string | null) {
  if (!pathname) return false
  return pathname.startsWith('/auth') || pathname.startsWith('/admin')
}

/** Opening brand moment — calm, intentional, hospitality-led. */
export function SplashScreen() {
  const pathname = usePathname()
  const { tx, lang } = useLanguage()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (isAuthRoute(pathname)) {
      setVisible(false)
      return
    }

    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') {
        setVisible(false)
        return
      }
    } catch {
      // private mode — still show once this mount
    }

    setVisible(true)

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const leaveAt = reduce ? 280 : DURATION_MS
    const fadeAt = Math.max(0, leaveAt - 520)

    const fadeTimer = window.setTimeout(() => setLeaving(true), fadeAt)
    const hideTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        /* ignore */
      }
      setVisible(false)
    }, leaveAt)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [pathname])

  if (!visible || isAuthRoute(pathname)) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!leaving}
      aria-label={tx('جاري التحميل', 'Loading')}
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#2a142a] text-brand-cream transition-[opacity,transform] duration-500 ease-out',
        leaving ? 'pointer-events-none scale-[1.015] opacity-0' : 'opacity-100',
      )}
    >
      {/* Atmospheric plate — full bleed */}
      <Image
        src="/images/brand/brand-table.webp"
        alt=""
        fill
        priority
        className="object-cover object-center motion-safe:animate-[splash-ken_8s_ease-out_both]"
        sizes="100vw"
      />

      {/* Depth: soft vignette + brand wash */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,10,28,0.55)_0%,rgba(42,20,42,0.72)_42%,rgba(26,10,28,0.88)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(200,150,46,0.18),transparent_52%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-8 text-center">
        {/* Mark */}
        <div className="relative mb-7 motion-safe:animate-[splash-rise_0.9s_cubic-bezier(0.22,1,0.36,1)_both]">
          <span
            aria-hidden
            className="absolute -inset-5 rounded-full bg-brand-sand/10 blur-2xl motion-safe:animate-[splash-glow_2.4s_ease-in-out_infinite]"
          />
          <div className="relative grid size-[5.5rem] place-items-center rounded-full border border-brand-sand/35 bg-[rgba(42,20,42,0.55)] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.65)] backdrop-blur-[2px] sm:size-24">
            <Image
              src="/images/brand/logo-mark.webp"
              alt="Event Catering"
              width={88}
              height={88}
              priority
              className="size-[4.25rem] rounded-full object-cover sm:size-[4.75rem]"
            />
          </div>
        </div>

        {/* Wordmark — one brand signal */}
        <p
          className={cn(
            display.className,
            'motion-safe:animate-[splash-rise_0.9s_cubic-bezier(0.22,1,0.36,1)_0.08s_both]',
            'text-[2.05rem] font-medium leading-none tracking-[0.14em] text-brand-cream sm:text-[2.35rem]',
          )}
        >
          EVENT
        </p>
        <p
          className={cn(
            display.className,
            'mt-1.5 motion-safe:animate-[splash-rise_0.9s_cubic-bezier(0.22,1,0.36,1)_0.14s_both]',
            'text-[0.72rem] font-medium tracking-[0.42em] text-brand-sand uppercase sm:text-[0.78rem]',
          )}
        >
          Catering
        </p>

        <div
          aria-hidden
          className="mt-6 flex items-center gap-3 motion-safe:animate-[splash-rise_0.9s_cubic-bezier(0.22,1,0.36,1)_0.2s_both]"
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-brand-sand/70" />
          <span className="size-1 rotate-45 bg-brand-sand/90" />
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-brand-sand/70" />
        </div>

        <p
          className={cn(
            'mt-5 max-w-[16rem] motion-safe:animate-[splash-rise_0.9s_cubic-bezier(0.22,1,0.36,1)_0.26s_both]',
            lang === 'ar'
              ? 'font-ar text-[0.95rem] font-medium leading-relaxed tracking-wide text-brand-cream/88'
              : cn(display.className, 'text-[0.95rem] font-medium leading-relaxed tracking-[0.04em] text-brand-cream/88'),
          )}
        >
          {tx('ضيافة تليق بمناسبتك', 'Hospitality shaped for your occasion')}
        </p>

        <p className="mt-2 motion-safe:animate-[splash-rise_0.9s_cubic-bezier(0.22,1,0.36,1)_0.3s_both] text-[0.65rem] font-medium uppercase tracking-[0.28em] text-brand-cream/45">
          {tx('عُمان', 'Oman')}
        </p>

        {/* Progress */}
        <div className="mt-10 w-40 motion-safe:animate-[splash-rise_0.9s_cubic-bezier(0.22,1,0.36,1)_0.34s_both]">
          <div className="h-[1.5px] overflow-hidden rounded-full bg-brand-cream/12">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-sand/50 via-brand-sand to-brand-sand/70"
              style={{
                width: '0%',
                animation: `event-splash-fill ${DURATION_MS}ms cubic-bezier(0.4,0,0.2,1) forwards`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
