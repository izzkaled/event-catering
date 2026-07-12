'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/components/language-provider'

/** Top bar: desktop full nav; mobile = logo + language only (tabs live in MobileBottomNav). */
export function SiteHeader() {
  const [loggedIn, setLoggedIn] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false))
  }, [])

  const navLinks = [
    { href: '/#services', label: t('nav.services') },
    { href: '/#packages', label: t('packages.title') },
    { href: '/booking', label: t('nav.booking') },
    ...(loggedIn ? [{ href: '/subscriptions', label: t('nav.subscriptions') }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md pt-safe">
      <div className="mx-auto flex h-14 min-h-14 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4">
        <Link href="/" className="flex min-w-0 max-w-[75%] items-center gap-2 sm:max-w-none">
          <BrandLogo subtitle="نظافة بلس · Muscat" className="min-w-0" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="md:flex" />
          <div className="hidden items-center gap-2 md:flex">
            {loggedIn ? (
              <Button render={<Link href="/profile" />} nativeButton={false} variant="outline" size="sm">
                <User className="size-4" />
                {t('nav.profile')}
              </Button>
            ) : (
              <Button render={<Link href="/auth/login" />} nativeButton={false} variant="outline" size="sm">
                {t('nav.login')}
              </Button>
            )}
            <Button render={<Link href="/booking" />} nativeButton={false} size="sm">
              {t('nav.booking')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
