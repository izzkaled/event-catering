'use client'

import Image from 'next/image'
import { BrandPalmSvg } from '@/components/brand-palm-svg'
import { cn } from '@/lib/utils'

/** Soft animated Khousa brand motifs for the sticky header. */
export function HeaderBrandMotion({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,color-mix(in_srgb,var(--brand-sand)_22%,transparent),transparent_55%)] motion-safe:animate-khousa-wash" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_120%,color-mix(in_srgb,var(--brand-palm)_10%,transparent),transparent_50%)] motion-safe:animate-khousa-wash-alt" />

      {/* Crisp SVG fronds — primary motion */}
      <BrandPalmSvg
        tone="mix"
        className="absolute -start-4 top-1/2 h-9 w-auto -translate-y-1/2 opacity-35 motion-safe:animate-khousa-sway sm:h-11 sm:opacity-45 md:start-0 md:h-12"
      />
      <BrandPalmSvg
        tone="sand"
        className="absolute -end-6 top-2 h-8 w-auto opacity-30 motion-safe:animate-khousa-float sm:h-10 sm:opacity-40 md:end-0 md:h-11"
      />

      {/* Raster accents from brand image set */}
      <Image
        src="/images/brand/palm-frond.png"
        alt=""
        width={420}
        height={236}
        className="absolute start-[18%] bottom-0 hidden h-10 w-auto opacity-25 motion-safe:animate-khousa-float md:block"
        priority={false}
      />
      <Image
        src="/images/brand/sparkles.png"
        alt=""
        width={256}
        height={256}
        className="absolute end-[22%] top-0 hidden h-9 w-auto opacity-35 motion-safe:animate-khousa-sparkle lg:block"
        priority={false}
      />
      <Image
        src="/images/brand/palm-accents.png"
        alt=""
        width={420}
        height={236}
        className="absolute start-[55%] top-1/2 hidden h-8 w-auto -translate-y-1/2 opacity-20 motion-safe:animate-khousa-sparkle-delayed xl:block"
        priority={false}
      />
    </div>
  )
}
