'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/brand-logo'

const DURATION_MS = 2600

/** Premium brand splash for Event Catering. */
export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const leaveAt = reduce ? 350 : DURATION_MS
    const fadeAt = Math.max(0, leaveAt - 400)

    const fadeTimer = window.setTimeout(() => setLeaving(true), fadeAt)
    const hideTimer = window.setTimeout(() => setVisible(false), leaveAt)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!leaving}
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-brand-palm text-brand-cream transition-opacity duration-500',
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <Image
        src="/images/brand/brand-uniform.webp"
        alt=""
        fill
        priority
        className="object-cover opacity-40"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--brand-palm)_82%,transparent),color-mix(in_srgb,var(--brand-palm)_92%,transparent))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,color-mix(in_srgb,var(--brand-sand)_22%,transparent),transparent_55%)]" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="mb-8 animate-[fade-up_0.7s_ease-out_both]">
          <BrandLogo size="xl" full variant="onDark" className="justify-center" />
        </div>

        <p className="animate-[fade-up_0.7s_ease-out_0.1s_both] font-ios text-[10px] font-medium uppercase tracking-[0.42em] text-brand-sand">
          Hospitality · Oman
        </p>
        <h1 className="mt-4 animate-[fade-up_0.7s_ease-out_0.16s_both] font-brand text-3xl font-medium tracking-[0.04em] sm:text-4xl">
          EVENT
        </h1>
        <p className="mt-2 animate-[fade-up_0.7s_ease-out_0.22s_both] text-sm font-light tracking-[0.28em] text-brand-cream/75 uppercase">
          Preparing your experience
        </p>

        <div className="mt-10 h-px w-36 overflow-hidden bg-brand-cream/15">
          <div
            className="h-full bg-brand-sand"
            style={{
              width: '0%',
              animation: `event-splash-fill ${DURATION_MS}ms cubic-bezier(0.4,0,0.2,1) forwards`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
