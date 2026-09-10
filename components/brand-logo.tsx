import Image from 'next/image'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  /** Show EVENT / CATERING wordmark beside the mark. */
  showText?: boolean
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** onLight = plum on cream surfaces. onDark = cream/gold on plum surfaces. */
  variant?: 'onLight' | 'onDark'
  /** Prefer full lockup image when available (wordmark baked in). */
  full?: boolean
}

const sizes = {
  sm: { mark: 36, text: 'text-sm', sub: 'text-[0.55rem]' },
  md: { mark: 44, text: 'text-base', sub: 'text-[0.6rem]' },
  lg: { mark: 64, text: 'text-xl', sub: 'text-[0.7rem]' },
  xl: { mark: 88, text: 'text-2xl', sub: 'text-[0.75rem]' },
} as const

export function BrandLogo({
  className,
  imageClassName,
  showText = false,
  subtitle,
  size = 'md',
  variant = 'onLight',
  full = false,
}: BrandLogoProps) {
  const s = sizes[size]
  const word = variant === 'onDark' ? 'text-brand-cream' : 'text-brand-palm'
  const sub = 'text-brand-sand'

  if (full) {
    const h = Math.round(s.mark * 1.15)
    const w = Math.round(h * 2.4)
    return (
      <span className={cn('flex min-w-0 items-center', className)}>
        <Image
          src="/images/brand/logo-full.webp"
          alt="Event Catering"
          width={w}
          height={h}
          className={cn('h-auto w-auto object-contain', imageClassName)}
          style={{ height: h, width: 'auto' }}
          priority
        />
        {subtitle && (
          <span className="ms-2 hidden truncate text-[0.7rem] text-muted-foreground sm:block">
            {subtitle}
          </span>
        )}
      </span>
    )
  }

  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span
        className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-full', imageClassName)}
        style={{ height: s.mark, width: s.mark }}
      >
        <Image
          src="/images/brand/logo-mark.webp"
          alt=""
          width={s.mark}
          height={s.mark}
          className="h-full w-full object-cover"
          priority
        />
      </span>
      {(showText || subtitle) && (
        <span className="min-w-0 flex flex-col leading-none">
          <span className={cn('font-ios truncate font-semibold tracking-tight', word, s.text)}>
            EVENT
          </span>
          <span
            className={cn(
              'mt-1 font-ios font-medium uppercase tracking-[0.28em]',
              sub,
              s.sub,
            )}
          >
            CATERING
          </span>
          {subtitle && (
            <span className="mt-1 hidden truncate text-[0.7rem] text-muted-foreground sm:block">
              {subtitle}
            </span>
          )}
        </span>
      )}
      <span className="sr-only">Event Catering</span>
    </span>
  )
}
