'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

type CinematicWaitingProps = {
  title?: string
  subtitle?: string
  brandLine?: string
  className?: string
  variant?: 'full' | 'section'
  children?: React.ReactNode
}

/** Quiet, light, luxurious Khousa waiting stage. */
export function CinematicWaiting({
  title = 'لحظة…',
  subtitle = 'نجهّز تجربتك بهدوء',
  brandLine = 'خوصة · KHOUSA',
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
      {/* Soft atmosphere — light, not heavy */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,color-mix(in_srgb,var(--brand-sand)_28%,transparent),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_90%,color-mix(in_srgb,var(--brand-palm)_08%,transparent),transparent_50%)]" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center">
        <div className="relative mb-7">
          <div className="absolute -inset-4 rounded-full bg-brand-sand/20 blur-xl motion-safe:animate-khousa-pulse-soft" />
          <div className="relative overflow-hidden rounded-full bg-brand-palm shadow-lg shadow-brand-palm/15 ring-1 ring-brand-sand/40">
            <Image
              src="/logo-icon.png"
              alt="خوصة"
              width={80}
              height={80}
              priority
              className="size-[4.5rem] object-cover sm:size-20"
            />
          </div>
        </div>

        <p className="font-brand text-[10px] font-semibold uppercase tracking-[0.38em] text-brand-sand">
          {brandLine}
        </p>

        <h1 className="mt-3 font-brand text-2xl font-extrabold tracking-tight text-brand-palm sm:text-3xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}

        <div className="mt-8 h-[2px] w-28 overflow-hidden rounded-full bg-brand-sand/25">
          <div className="h-full w-1/2 rounded-full bg-brand-sand motion-safe:animate-khousa-progress" />
        </div>

        {children && <div className="relative z-10 mt-8 w-full">{children}</div>}
      </div>
    </div>
  )
}
