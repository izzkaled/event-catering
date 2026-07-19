'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CalendarPlus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
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
    <header className="sticky top-0 z-50 w-full min-w-0 overflow-x-clip border-b border-border/80 bg-background/90 pt-safe shadow-sm backdrop-blur-md">
      <div className="site-container grid h-14 min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:h-16 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 overflow-hidden rounded-xl transition-opacity hover:opacity-90"
        >
          <BrandLogo showText={false} className="min-w-0 sm:hidden" />
          <BrandLogo subtitle="نظافة بلس · Muscat" className="hidden min-w-0 sm:flex" />
        </Link>

        <nav
          className="hidden min-w-0 items-center gap-0.5 overflow-x-auto rounded-xl border border-border/60 bg-secondary/40 p-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden"
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
                    ? 'bg-background text-primary shadow-sm ring-1 ring-primary/15'
                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
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
                  'gap-1.5 border-border/80 bg-background/80',
                  pathname?.startsWith('/profile') && 'border-primary/30 bg-primary/5 text-primary',
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
                className="border-border/80 bg-background/80 whitespace-nowrap"
              >
                {t('nav.login')}
              </Button>
            )}
            <Button
              render={<Link href="/booking" />}
              nativeButton={false}
              size="sm"
              className="gap-1.5 whitespace-nowrap shadow-md shadow-primary/15"
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
