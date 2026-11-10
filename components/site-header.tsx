'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { MagicWand, User } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { HeaderBrandMotion } from '@/components/header-brand-motion'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  active: boolean
}

/** Desktop sticky nav — phones use MobileBottomNav instead. */
export function SiteHeader() {
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { t, lang } = useLanguage()

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false))
  }, [pathname])

  useEffect(() => {
    // Hysteresis avoids sticky height flip-flop near the threshold
    const onScroll = () => {
      const y = window.scrollY
      setScrolled((prev) => (prev ? y > 4 : y > 16))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onPackages =
    pathname?.startsWith('/packages') || pathname?.startsWith('/experience')
  const onHome = pathname === '/'
  const onProfile = pathname?.startsWith('/profile')

  const links: NavItem[] = [
    { href: '/packages', label: t('nav.packages'), active: !!onPackages },
    { href: '/#how', label: t('nav.how'), active: false },
  ]

  return (
    <header
      className={cn(
        // Phone uses MobileBottomNav — keep this sticky bar for md+ only.
        'sticky top-0 z-50 hidden w-full min-w-0 pt-safe backdrop-blur-xl transition-[background-color,box-shadow] duration-300 ease-out md:block',
        // Blur strength stays fixed — tweening backdrop-filter was the lag source.
        scrolled
          ? 'bg-brand-cream/88 shadow-[0_10px_40px_-18px_rgba(31,26,23,0.35)]'
          : 'bg-brand-cream/72',
      )}
    >
      <HeaderBrandMotion />

      <div
        className={cn(
          'site-container relative z-10 transition-[padding] duration-300 ease-out',
          scrolled ? 'py-2' : 'py-3 sm:py-3.5',
        )}
      >
        <div
          className={cn(
            'relative grid items-center gap-2 rounded-2xl border px-3 sm:gap-3 sm:px-4',
            'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
            'transition-[height,background-color,border-color,box-shadow] duration-300 ease-out',
            scrolled
              ? 'h-14 border-[var(--line)] bg-white/75 shadow-[0_8px_30px_-20px_rgba(31,26,23,0.45)]'
              : 'h-14 border-transparent bg-transparent sm:h-16 sm:border-[var(--line)]/70 sm:bg-white/45 sm:shadow-[0_12px_40px_-28px_rgba(31,26,23,0.35)]',
          )}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-sand/70 to-transparent opacity-80"
          />

          <Link
            href="/"
            className="group relative z-10 flex min-w-0 items-center gap-2 justify-self-start overflow-hidden rounded-xl py-1 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Event Catering"
          >
            <BrandLogo size="md" showText className="min-w-0" />
            {onHome && (
              <span
                aria-hidden
                className="absolute -bottom-0.5 start-2 end-2 h-0.5 rounded-full bg-gradient-to-r from-brand-sand/0 via-brand-sand to-brand-sand/0"
              />
            )}
          </Link>

          <nav
            className="relative z-10 min-w-0 justify-self-center"
            aria-label={lang === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}
          >
            <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl bg-[var(--paper-deep)]/55 p-1 ring-1 ring-[var(--line)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {links.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className={cn(
                    'relative shrink-0 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide transition-colors duration-200 lg:px-3.5',
                    link.active
                      ? 'bg-white text-brand-palm shadow-sm'
                      : 'text-[var(--ink-soft)] hover:bg-white/70 hover:text-brand-palm',
                  )}
                >
                  {link.label}
                  {link.active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-sand"
                    />
                  )}
                </Link>
              ))}
            </div>
          </nav>

          <div className="relative z-10 flex shrink-0 items-center justify-end gap-2 justify-self-end">
            <LanguageSwitcher />

            <div className="flex items-center gap-2">
              {loggedIn ? (
                <Button
                  render={<Link href="/profile" />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'border-[var(--line)] bg-white/80',
                    onProfile && 'bg-[var(--paper-deep)] text-brand-palm',
                  )}
                >
                  <User weight="duotone" className="size-4 shrink-0" />
                  <span className="whitespace-nowrap">{t('nav.profile')}</span>
                </Button>
              ) : (
                <Button
                  render={<Link href="/auth/login" />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  className="border-[var(--line)] bg-white/80"
                >
                  {t('nav.login')}
                </Button>
              )}
              <Button
                render={<Link href="/packages" />}
                nativeButton={false}
                size="sm"
                className="gap-1.5 border-0 bg-gradient-to-br from-[#e0b45a] via-brand-sand to-[#a67c2d] text-[var(--ink)] shadow-[0_8px_22px_-8px_rgba(168,124,45,0.7)] hover:brightness-105 hover:shadow-[0_10px_26px_-8px_rgba(168,124,45,0.85)]"
              >
                <MagicWand weight="fill" className="size-4 shrink-0" />
                {lang === 'ar' ? 'ابدأ' : 'Start'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
