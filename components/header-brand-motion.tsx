'use client'

import { cn } from '@/lib/utils'

/** Soft gold shimmer for sticky header — no old brand motifs. */
export function HeaderBrandMotion({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,color-mix(in_srgb,var(--brand-sand)_18%,transparent),transparent_55%)] motion-safe:animate-[event-wash_10s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_120%,color-mix(in_srgb,var(--brand-palm)_08%,transparent),transparent_50%)] motion-safe:animate-[event-wash-alt_12s_ease-in-out_infinite]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-sand/35 to-transparent" />
    </div>
  )
}
