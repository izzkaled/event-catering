'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CalendarPlus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { HeaderBrandMotion } from '@/components/header-brand-motion'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

function isNavLinkActive(pathname: string | null, href: string) {
  if (!pathname) return false
  if (href === '/booking') return pathname.startsWith('/booking')
  if (href === '/subscriptions') return pathname.startsWith('/subscriptions')
  if (href === '/#services' || href === '/#packages') return pathname === '/'
  return false
}

/** Top bar: desktop nav + actions; mobile = logo + language only (tabs in MobileBottomNav). */
export function SiteHeader() {
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)
  const { t, lang } = useLanguage()

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false))
  }, [pathname])

  const navLinks = [
    { href: '/#services', label: t('nav.services') },
    { href: '/#packages', label: t('nav.packages') },
    { href: '/booking', label: t('nav.booking') },
    ...(loggedIn ? [{ href: '/subscriptions', label: t('nav.subscriptions') }] : []),
  ]

  return (
    <header className="relative sticky top-0 z-50 w-full min-w-0 overflow-x-clip border-b border-brand-sand/25 bg-brand-cream/92 pt-safe shadow-[0_1px_0_color-mix(in_srgb,var(--brand-palm)_4%,transparent)] backdrop-blur-md">
      <HeaderBrandMotion />

      <div className="site-container relative z-10 grid h-14 min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:h-[4.25rem] md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 overflow-hidden rounded-lg transition-opacity hover:opacity-90"
          aria-label="خوصة · KHOUSA"
        >
          <BrandLogo size="sm" className="min-w-0 sm:hidden" />
          <BrandLogo size="md" className="hidden min-w-0 sm:flex" />
        </Link>

        <nav
          className="hidden min-w-0 items-center gap-0.5 overflow-x-auto rounded-xl border border-brand-sand/30 bg-secondary/50 p-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden"
          aria-label={lang === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}
        >
          {navLinks.map((link) => {
            const active = isNavLinkActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-card text-brand-palm shadow-sm ring-1 ring-brand-sand/35'
                    : 'text-muted-foreground hover:bg-card/80 hover:text-brand-palm',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <div className="hidden items-center gap-2 md:flex">
            {loggedIn ? (
              <Button
                render={<Link href="/profile" />}
                nativeButton={false}
                variant="outline"
                size="sm"
                className={cn(
                  'gap-1.5 border-brand-sand/35 bg-card/80',
                  pathname?.startsWith('/profile') && 'border-brand-sand/50 bg-brand-sand/10 text-brand-palm',
                )}
              >
                <User className="size-4 shrink-0" />
                <span className="whitespace-nowrap">{t('nav.profile')}</span>
              </Button>
            ) : (
              <Button
                render={<Link href="/auth/login" />}
                nativeButton={false}
                variant="outline"
                size="sm"
                className="border-brand-sand/35 bg-card/80 whitespace-nowrap"
              >
                {t('nav.login')}
              </Button>
            )}
            <Button
              render={<Link href="/booking" />}
              nativeButton={false}
              size="sm"
              className="gap-1.5 whitespace-nowrap bg-brand-palm text-brand-cream shadow-md shadow-brand-palm/20 hover:bg-brand-palm/90"
            >
              <CalendarPlus className="size-4 shrink-0" />
              {t('nav.booking')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
