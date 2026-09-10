'use client'

import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/brand-logo'

type CinematicWaitingProps = {
  title?: string
  subtitle?: string
  brandLine?: string
  className?: string
  variant?: 'full' | 'section'
  children?: React.ReactNode
}

/** Quiet luxury waiting stage for Event Catering. */
export function CinematicWaiting({
  title = 'لحظة…',
  subtitle = 'نجهّز طلب الضيافة بعناية',
  brandLine = 'EVENT CATERING',
  className,
  variant = 'full',
  children,
}: CinematicWaitingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'relative isolate overflow-hidden bg-brand-cream text-brand-palm',
        variant === 'full' && 'flex min-h-[100dvh] w-full flex-col items-center justify-center',
        variant === 'section' && 'flex min-h-[22rem] w-full flex-col items-center justify-center rounded-3xl',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,color-mix(in_srgb,var(--brand-sand)_22%,transparent),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_90%,color-mix(in_srgb,var(--brand-palm)_08%,transparent),transparent_50%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <BrandLogo size="lg" showText className="mb-6 justify-center" />
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.38em] text-brand-sand">
          {brandLine}
        </p>
        <h1 className="mt-3 font-brand text-2xl font-medium tracking-wide sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-sm text-sm font-light text-muted-foreground">{subtitle}</p>

        <div className="mt-8 h-px w-28 overflow-hidden bg-brand-sand/25">
          <div className="h-full w-1/2 animate-pulse bg-brand-sand" />
        </div>
        {children}
      </div>
    </div>
  )
}
