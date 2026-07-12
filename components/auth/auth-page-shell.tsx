'use client'

import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/brand-logo'
import { useLanguage } from '@/components/language-provider'

type AuthPageShellProps = {
  children: ReactNode
}

export function AuthPageShell({ children }: AuthPageShellProps) {
  const { lang } = useLanguage()

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-3 py-8 sm:px-4 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/12 via-background to-background" />
      <div className="pointer-events-none absolute -start-24 top-16 size-72 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -end-24 bottom-8 size-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-5xl">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <BrandLogo
            size="lg"
            showText={false}
            imageClassName="shadow-lg shadow-primary/20"
          />
          <p className="text-sm font-bold tracking-wide text-muted-foreground">
            Speedy Cleaning · {lang === 'ar' ? 'نظافة بلس' : 'Clean Plus'}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
