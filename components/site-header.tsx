'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Layers, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { HeaderBrandMotion } from '@/components/header-brand-motion'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

/** Top bar: logo, few links, language, account + one CTA. */
export function SiteHeader() {
  const pathname = usePathname()
  const [loggedIn, setLoggedIn] = useState(false)
  const { t, lang } = useLanguage()

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false))
  }, [pathname])

  const onPackages =
    pathname?.startsWith('/packages') || pathname?.startsWith('/experience')

  return (
    <header className="relative sticky top-0 z-50 w-full min-w-0 overflow-x-clip border-b border-brand-sand/25 bg-brand-cream/92 pt-safe shadow-[0_1px_0_color-mix(in_srgb,var(--brand-palm)_4%,transparent)] backdrop-blur-md">
      <HeaderBrandMotion />

      <div className="site-container relative z-10 flex h-14 min-h-14 items-center justify-between gap-3 sm:h-[4.25rem]">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 overflow-hidden rounded-lg transition-opacity hover:opacity-90"
          aria-label="Event Catering"
        >
          <BrandLogo size="sm" className="min-w-0 sm:hidden" />
          <BrandLogo size="md" showText className="hidden min-w-0 sm:flex" />
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label={lang === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}
        >
          <Link
            href="/packages"
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              onPackages
                ? 'bg-card text-brand-palm shadow-sm ring-1 ring-brand-sand/35'
                : 'text-muted-foreground hover:text-brand-palm',
            )}
          >
            {t('nav.packages')}
          </Link>
          <Link
            href="/#how"
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand-palm"
          >
            {t('nav.how')}
          </Link>
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
              render={<Link href="/packages" />}
              nativeButton={false}
              size="sm"
              className="gap-1.5 whitespace-nowrap tracking-wide shadow-md shadow-brand-palm/20"
            >
              <Layers className="size-4 shrink-0" />
              {lang === 'ar' ? 'ابدأ' : 'Start'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
