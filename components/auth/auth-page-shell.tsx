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
    <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-x-clip px-3 py-8 sm:px-4 sm:py-14">
      <div className="pointer-events-none absolute inset-0 glow-sand" />
      <div className="pointer-events-none absolute -start-24 top-16 size-72 rounded-full bg-brand-sand/20 blur-3xl" />
      <div className="pointer-events-none absolute -end-24 bottom-8 size-80 rounded-full bg-brand-palm/10 blur-3xl" />

      <div className="relative mx-auto w-full min-w-0 max-w-5xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandLogo size="xl" />
          <p className="brand-kicker">
            {lang === 'ar' ? 'عُمان · مسقط' : 'OMAN · MUSCAT'}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
