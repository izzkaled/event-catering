'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { authClient } from '@/lib/auth-client'

const nav = [
  { href: '/admin', key: 'admin.nav.dashboard' as const, icon: LayoutDashboard },
  { href: '/admin/orders', key: 'admin.nav.orders' as const, icon: ClipboardList },
  { href: '/admin/customers', key: 'admin.nav.customers' as const, icon: Users },
  { href: '/admin/packages', key: 'admin.nav.packages' as const, icon: Package },
  { href: '/admin/content-studio', key: 'admin.nav.contentStudio' as const, icon: FileText },
  { href: '/admin/ai-assistant', key: 'admin.nav.aiAssistant' as const, icon: Bot },
  { href: '/admin/schedule', key: 'admin.nav.schedule' as const, icon: CalendarDays },
  { href: '/admin/analytics', key: 'admin.nav.analytics' as const, icon: BarChart3 },
]

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}

export function AdminAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { lang, setLang, t, dir } = useLanguage()
  const current = nav.find((n) => isActive(pathname, n.href))

  const logout = async () => {
    await Promise.all([
      authClient.signOut().catch(() => null),
      fetch('/api/phone/logout', { method: 'POST' }).catch(() => null),
    ])
    window.location.href = '/'
  }

  const Nav = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const Icon = item.icon
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
            }`}
          >
            <Icon className="size-4.5" />
            {t(item.key)}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-background" dir={dir}>
      <aside className="hidden w-72 shrink-0 flex-col border-l border-sidebar-border bg-sidebar p-4 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <span className="text-lg font-extrabold">Speedy Cleaning</span>
        </Link>
        {Nav}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Button render={<Link href="/" />} nativeButton={false} variant="outline" className="w-full">
            <Home className="size-4" />
            {t('admin.backToSite')}
          </Button>
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="size-4" />
            {t('admin.logout')}
          </Button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-72 flex-col border-l border-sidebar-border bg-sidebar p-4">
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="size-5" />
                </span>
                <span className="text-lg font-extrabold">Speedy Cleaning</span>
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            {Nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setOpen(true)}
              className="flex size-11 items-center justify-center rounded-lg lg:hidden"
            >
              <Menu className="size-6" />
            </button>
            <h1 className="text-lg font-bold">{current ? t(current.key) : t('admin.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-2.5 py-1 text-sm text-muted-foreground hover:bg-muted"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            >
              {lang === 'ar' ? 'EN' : 'AR'}
            </button>
            <Button variant="outline" size="sm" onClick={logout} className="lg:hidden">
              <LogOut className="size-4" />
              {t('admin.logout')}
            </Button>
            <span className="hidden text-sm text-muted-foreground sm:inline">{t('admin.title')}</span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

