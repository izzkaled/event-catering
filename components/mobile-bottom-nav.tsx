'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { House, Stack, UserCircle } from '@phosphor-icons/react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

const HIDDEN_PREFIXES = ['/admin', '/auth', '/booking', '/experience']

/** Spacer height: floating bar + float gap + safe area */
const NAV_SPACE =
  'h-[calc(4.85rem+env(safe-area-inset-bottom,0px))] md:hidden'

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

  useEffect(() => {
    if (hidden) return

    let disposed = false
    let raf = 0
    let applied = 0
    let sync: (() => void) | null = null

    const isEditing = () => {
      const el = document.activeElement
      if (!el || !(el instanceof HTMLElement)) return false
      const tag = el.tagName
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
      )
    }

    const attach = () => {
      if (disposed) return
      const shell = shellRef.current
      if (!shell) return

      // Only lift above the virtual keyboard. Do NOT track browser chrome
      // (address bar / chin) — those visualViewport changes cause nav shake.
      sync = () => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          const vv = window.visualViewport
          if (!vv || (vv.scale ?? 1) > 1.01 || !isEditing()) {
            if (applied !== 0) {
              applied = 0
              shell.style.removeProperty('transform')
            }
            return
          }
          const shift = Math.round(window.innerHeight - vv.height - vv.offsetTop)
          // Large threshold + hysteresis: ignore address-bar sized deltas
          const next = shift > 120 ? shift : 0
          if (Math.abs(next - applied) < 12) return
          applied = next
          shell.style.transform =
            next > 0 ? `translate3d(0, ${-next}px, 0)` : 'translate3d(0, 0, 0)'
        })
      }

      sync()
      window.visualViewport?.addEventListener('resize', sync)
      window.addEventListener('focusin', sync)
      window.addEventListener('focusout', sync)
      window.addEventListener('orientationchange', sync)
    }

    const start = window.requestAnimationFrame(attach)

    return () => {
      disposed = true
      window.cancelAnimationFrame(start)
      cancelAnimationFrame(raf)
      if (sync) {
        window.visualViewport?.removeEventListener('resize', sync)
        window.removeEventListener('focusin', sync)
        window.removeEventListener('focusout', sync)
        window.removeEventListener('orientationchange', sync)
      }
      shellRef.current?.style.removeProperty('transform')
    }
  }, [hidden])

  if (hidden) return null

  const accountHref = loggedIn ? '/profile' : '/auth/login'
  const accountLabel = loggedIn ? t('nav.profile') : t('nav.loginShort')

  const items = [
    {
      href: '/',
      label: t('nav.home'),
      icon: House,
      active: pathname === '/',
    },
    {
      href: '/packages',
      label: t('nav.packages'),
      icon: Stack,
      active: pathname?.startsWith('/packages') || pathname?.startsWith('/experience'),
    },
    {
      href: accountHref,
      label: accountLabel,
      icon: UserCircle,
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
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3.5 pb-[max(0.7rem,env(safe-area-inset-bottom,0px))] pt-1 md:hidden backface-hidden transform-[translate3d(0,0,0)]"
      >
        <nav
          dir={dir}
          aria-label={lang === 'ar' ? 'التنقل السفلي' : 'Bottom navigation'}
          className={cn(
            'pointer-events-auto mx-auto w-full max-w-md',
            'rounded-full border border-white/55',
            'bg-white/40 shadow-[0_12px_40px_-14px_rgba(31,26,23,0.38),0_2px_10px_-4px_rgba(31,26,23,0.12)]',
            'backdrop-blur-2xl backdrop-saturate-150',
            'ring-1 ring-black/[0.04]',
          )}
        >
          <ul className="grid h-[3.45rem] grid-cols-3 gap-0.5 p-1">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href} className="min-w-0">
                  <Link
                    href={item.href}
                    className={cn(
                      'relative flex h-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-full px-1',
                      'transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.94]',
                      item.active
                        ? 'text-brand-palm'
                        : 'text-brand-palm/55 hover:text-brand-palm/80',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'absolute inset-0 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        item.active
                          ? 'scale-100 bg-brand-palm/[0.09] opacity-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]'
                          : 'scale-90 bg-transparent opacity-0',
                      )}
                    />
                    <Icon
                      weight={item.active ? 'fill' : 'bold'}
                      className={cn(
                        'relative size-[1.35rem] shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        item.active && 'scale-105',
                      )}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        'relative w-full truncate text-center text-[10.5px] leading-none tracking-wide transition-all duration-400',
                        item.active ? 'font-bold' : 'font-semibold',
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
