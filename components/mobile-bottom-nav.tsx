'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Home, Layers, UserRound } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

const HIDDEN_PREFIXES = ['/admin', '/auth', '/booking', '/experience']

/** Spacer height: floating bar (~3.5rem) + float gap + safe area */
const NAV_SPACE =
  'h-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:hidden'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { t, dir, lang } = useLanguage()
  const [loggedIn, setLoggedIn] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false))
  }, [pathname])

  const hidden = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))

  /**
   * Keep the floating dock in the visible viewport when mobile chrome
   * resizes — without fighting pinch-zoom.
   */
  useEffect(() => {
    if (hidden) return

    let disposed = false
    let raf = 0
    let sync: (() => void) | null = null

    const attach = () => {
      if (disposed) return
      const shell = shellRef.current
      if (!shell) return

      sync = () => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          const vv = window.visualViewport
          if (!vv || (vv.scale ?? 1) > 1.01) {
            shell.style.removeProperty('transform')
            return
          }
          const shift = Math.round(window.innerHeight - vv.height - vv.offsetTop)
          // Only nudge when keyboard/chrome actually eats space
          shell.style.transform =
            shift > 8 ? `translate3d(0, ${-shift}px, 0)` : 'translate3d(0, 0, 0)'
        })
      }

      sync()
      window.visualViewport?.addEventListener('resize', sync)
      window.visualViewport?.addEventListener('scroll', sync)
      window.addEventListener('resize', sync)
      window.addEventListener('orientationchange', sync)
    }

    const start = window.requestAnimationFrame(attach)

    return () => {
      disposed = true
      window.cancelAnimationFrame(start)
      cancelAnimationFrame(raf)
      if (sync) {
        window.visualViewport?.removeEventListener('resize', sync)
        window.visualViewport?.removeEventListener('scroll', sync)
        window.removeEventListener('resize', sync)
        window.removeEventListener('orientationchange', sync)
      }
    }
  }, [hidden])

  if (hidden) return null

  const accountHref = loggedIn ? '/profile' : '/auth/login'
  const accountLabel = loggedIn ? t('nav.profile') : t('nav.loginShort')

  const items = [
    {
      href: '/',
      label: t('nav.home'),
      icon: Home,
      active: pathname === '/',
    },
    {
      href: '/packages',
      label: t('nav.packages'),
      icon: Layers,
      active: pathname?.startsWith('/packages') || pathname?.startsWith('/experience'),
    },
    {
      href: accountHref,
      label: accountLabel,
      icon: UserRound,
      active:
        pathname?.startsWith('/profile') ||
        pathname?.startsWith('/subscriptions') ||
        pathname?.startsWith('/auth'),
    },
  ]

  return (
    <>
      <div className={NAV_SPACE} aria-hidden />

      <div
        ref={shellRef}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-1 md:hidden backface-hidden transform-[translate3d(0,0,0)]"
      >
        <nav
          dir={dir}
          aria-label={lang === 'ar' ? 'التنقل السفلي' : 'Bottom navigation'}
          className={cn(
            'pointer-events-auto mx-auto w-full max-w-md',
            'rounded-[1.65rem] border border-white/50',
            'bg-[#faf7f2]/88 shadow-[0_10px_40px_-12px_rgba(42,18,42,0.35),0_2px_8px_-2px_rgba(42,18,42,0.12)]',
            'backdrop-blur-xl backdrop-saturate-150',
            'ring-1 ring-black/4',
          )}
        >
          <ul className="grid h-[3.35rem] grid-cols-3 px-1.5">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href} className="min-w-0">
                  <Link
                    href={item.href}
                    className={cn(
                      'relative flex h-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 transition-colors',
                      'active:scale-[0.96]',
                      item.active ? 'text-[#4A234A]' : 'text-[#4A234A]/45',
                    )}
                  >
                    {item.active ? (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 top-1.5 h-8 rounded-full bg-[#4A234A]/08"
                      />
                    ) : null}
                    <Icon
                      className="relative size-[1.35rem]"
                      strokeWidth={item.active ? 2.4 : 1.75}
                      fill={item.active ? 'currentColor' : 'none'}
                      fillOpacity={item.active ? 0.18 : 0}
                    />
                    <span
                      className={cn(
                        'relative w-full truncate text-center text-[10px] leading-none tracking-wide',
                        item.active ? 'font-semibold' : 'font-medium',
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </>
  )
}
