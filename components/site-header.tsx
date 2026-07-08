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

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const navLinks = [
    { href: '/#services', label: t('nav.services') },
    { href: '/#packages', label: t('packages.title') },
    { href: '/booking', label: t('nav.booking') },
    ...(loggedIn ? [{ href: '/subscriptions', label: t('nav.subscriptions') }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md pt-safe">
      <div className="mx-auto flex h-14 min-h-14 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0 flex flex-col leading-tight">
            <span className="truncate text-sm font-extrabold tracking-tight">Speedy Cleaning</span>
            <span className="hidden truncate text-xs text-muted-foreground sm:block">
              نظافة بلس · Muscat
            </span>
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
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="touch-target flex shrink-0 items-center justify-center rounded-xl text-foreground active:bg-secondary md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 top-14 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <nav className="relative flex max-h-[calc(100dvh-3.5rem)] flex-col gap-1 overflow-y-auto border-t border-border bg-background px-3 py-4 pb-safe shadow-xl">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="touch-target flex items-center rounded-xl px-4 py-3.5 text-base font-medium text-foreground active:bg-secondary"
              >
                {link.label}
              </Link>
            ))}

            <div className="my-3 border-t border-border pt-4">
              <LanguageSwitcher />
            </div>

            <div className="flex flex-col gap-2">
              {loggedIn ? (
                <Button
                  render={<Link href="/profile" />}
                  nativeButton={false}
                  variant="outline"
                  className="h-12 w-full text-base"
                  onClick={() => setOpen(false)}
                >
                  <User className="size-4" />
                  {t('nav.profile')}
                </Button>
              ) : (
                <Button
                  render={<Link href="/auth/login" />}
                  nativeButton={false}
                  variant="outline"
                  className="h-12 w-full text-base"
                  onClick={() => setOpen(false)}
                >
                  {t('nav.login')}
                </Button>
              )}
              <Button
                render={<Link href="/booking" />}
                nativeButton={false}
                className="h-12 w-full text-base"
                onClick={() => setOpen(false)}
              >
                {t('nav.booking')}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
