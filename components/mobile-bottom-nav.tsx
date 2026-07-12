'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Layers, CalendarPlus, UserRound } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

const HIDDEN_PREFIXES = ['/admin', '/auth', '/booking']

export function MobileBottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false))
  }, [pathname])

  const hidden = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))
  if (hidden) return null

  const accountHref = loggedIn ? '/profile' : '/auth/login'
  const accountLabel = loggedIn ? t('nav.profile') : t('nav.login')

  const items = [
    {
      href: '/',
      label: t('nav.home'),
      icon: Home,
      active: pathname === '/',
    },
    {
      href: '/#packages',
      label: t('packages.title'),
      icon: Layers,
      active: false,
    },
    {
      href: '/booking',
      label: t('nav.booking'),
      icon: CalendarPlus,
      active: pathname?.startsWith('/booking'),
      primary: true,
    },
    {
      href: accountHref,
      label: accountLabel,
      icon: UserRound,
      active: pathname?.startsWith('/profile') || pathname?.startsWith('/subscriptions'),
    },
  ]

  return (
    <>
      {/* Spacer so page content clears the bar */}
      <div className="h-[calc(3.75rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden />

      <nav
        aria-label="التنقل السفلي"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-safe shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto flex h-[3.75rem] max-w-lg items-stretch justify-between px-1">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href + item.label} className="flex flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex min-h-11 w-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold transition-colors',
                    item.active ? 'text-primary' : 'text-muted-foreground active:text-foreground',
                  )}
                >
                  {item.primary ? (
                    <span
                      className={cn(
                        'mb-0.5 flex size-10 items-center justify-center rounded-2xl shadow-md shadow-primary/25',
                        item.active ? 'bg-primary text-primary-foreground' : 'bg-primary/90 text-primary-foreground',
                      )}
                    >
                      <Icon className="size-5" strokeWidth={2.25} />
                    </span>
                  ) : (
                    <Icon
                      className={cn('size-5', item.active && 'stroke-[2.5]')}
                      strokeWidth={item.active ? 2.5 : 2}
                    />
                  )}
                  <span className="max-w-full truncate leading-tight">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
