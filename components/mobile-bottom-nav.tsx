'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Home, Layers, UserRound } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

const HIDDEN_PREFIXES = ['/admin', '/auth', '/booking', '/experience']

export function MobileBottomNav() {
  const pathname = usePathname()
  const { t, dir, lang } = useLanguage()
  const [loggedIn, setLoggedIn] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false))
  }, [pathname])

  const hidden = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))

  /** Keep bar stuck to the visible screen bottom (mobile browser chrome / keyboard). */
  useEffect(() => {
    if (hidden) return

    let disposed = false
    let sync: (() => void) | null = null
    let nav: HTMLElement | null = null

    const attach = () => {
      if (disposed) return
      nav = navRef.current
      if (!nav) return

      sync = () => {
        if (!nav) return
        const vv = window.visualViewport
        if (!vv) {
          nav.style.removeProperty('transform')
          return
        }
        const shift = Math.round(window.innerHeight - vv.height - vv.offsetTop)
        nav.style.transform = shift ? `translate3d(0, ${-shift}px, 0)` : 'translate3d(0, 0, 0)'
      }

      sync()
      window.visualViewport?.addEventListener('resize', sync)
      window.visualViewport?.addEventListener('scroll', sync)
      window.addEventListener('resize', sync)
      window.addEventListener('orientationchange', sync)
    }

    const raf = window.requestAnimationFrame(attach)

    return () => {
      disposed = true
      window.cancelAnimationFrame(raf)
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
      highlight: true,
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
      <div className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] md:hidden" aria-hidden />

      <nav
        ref={navRef}
        dir={dir}
        aria-label={lang === 'ar' ? 'التنقل السفلي' : 'Bottom navigation'}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_16px_color-mix(in_srgb,#223826_8%,transparent)] backdrop-blur-md md:hidden [transform:translate3d(0,0,0)] [backface-visibility:hidden]"
      >
        <ul className="grid h-16 grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-full min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors',
                    item.active
                      ? 'text-primary'
                      : 'text-muted-foreground active:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-xl',
                      item.highlight &&
                        'bg-primary text-primary-foreground shadow-sm shadow-primary/20',
                      item.active && !item.highlight && 'bg-primary/10',
                    )}
                  >
                    <Icon className="size-5" strokeWidth={item.active ? 2.5 : 2} />
                  </span>
                  <span className="w-full truncate text-center text-[11px] font-semibold leading-none">
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
