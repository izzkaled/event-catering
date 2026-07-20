'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const DURATION_MS = 3000

/** Light 3-second brand splash on first paint. */
export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const leaveAt = reduce ? 400 : DURATION_MS
    const fadeAt = Math.max(0, leaveAt - 350)

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
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-cream text-brand-palm transition-opacity duration-300',
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,color-mix(in_srgb,var(--brand-sand)_26%,transparent),transparent_58%)]" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="mb-6 overflow-hidden rounded-full bg-brand-palm shadow-lg shadow-brand-palm/15 ring-1 ring-brand-sand/40">
          <Image
            src="/logo-icon.png"
            alt="خوصة"
            width={80}
            height={80}
            priority
            className="size-[4.5rem] object-cover sm:size-20"
          />
        </div>

        <p className="font-brand text-[10px] font-semibold uppercase tracking-[0.38em] text-brand-sand">
          خوصة · KHOUSA
        </p>
        <h1 className="mt-3 font-brand text-2xl font-extrabold tracking-tight sm:text-3xl">
          لحظة…
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">نجهّز تجربتك</p>

        <div className="mt-8 h-[2px] w-28 overflow-hidden rounded-full bg-brand-sand/25">
          <div
            className="h-full rounded-full bg-brand-sand"
            style={{
              width: '0%',
              animation: `khousa-splash-fill ${DURATION_MS}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
