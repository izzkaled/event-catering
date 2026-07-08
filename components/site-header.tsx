'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Sparkles, Menu, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/components/language-provider'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold tracking-tight">Speedy Cleaning</span>
            <span className="text-xs text-muted-foreground">نظافة بلس · Muscat, Oman</span>
          </div>
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

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
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

        <button
          type="button"
          aria-label="القائمة"
          onClick={() => setOpen((v) => !v)}
          className="flex size-11 items-center justify-center rounded-lg text-foreground md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between gap-2">
              <LanguageSwitcher />
              <div className="flex gap-2">
                {loggedIn ? (
                  <Button
                    render={<Link href="/profile" />}
                    nativeButton={false}
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    {t('nav.profile')}
                  </Button>
                ) : (
                  <Button
                    render={<Link href="/auth/login" />}
                    nativeButton={false}
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    {t('nav.login')}
                  </Button>
                )}
                <Button
                  render={<Link href="/booking" />}
                  nativeButton={false}
                  onClick={() => setOpen(false)}
                >
                  {t('nav.booking')}
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
