import Image from 'next/image'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  /** Show wordmark text beside the mark. Logo already includes خوصة/KHOUSA — default off for clarity. */
  showText?: boolean
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** onLight = palm mark on transparent (nav/cream). onDark = sand mark (dark banners). */
  variant?: 'onLight' | 'onDark'
}

const sizes = {
  sm: { height: 40, width: 54, text: 'text-sm' },
  md: { height: 48, width: 64, text: 'text-base' },
  lg: { height: 72, width: 96, text: 'text-lg' },
  xl: { height: 96, width: 128, text: 'text-xl' },
} as const

export function BrandLogo({
  className,
  imageClassName,
  showText = false,
  subtitle,
  size = 'md',
  variant = 'onLight',
}: BrandLogoProps) {
  const s = sizes[size]
  const src = variant === 'onDark' ? '/logo-sand.png' : '/logo-transparent.png'

  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative flex shrink-0 items-center justify-center',
          imageClassName,
        )}
        style={{ height: s.height, width: s.width }}
      >
        <Image
          src={src}
          alt="خوصة · KHOUSA Oman"
          width={s.width}
          height={s.height}
          className="h-full w-full object-contain"
          priority
        />
      </span>
      {(showText || subtitle) && (
        <span className="min-w-0 flex flex-col leading-tight">
          <span className={cn('font-brand truncate font-extrabold tracking-tight text-brand-palm', s.text)}>
            خوصة
          </span>
          <span className="font-brand text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-brand-sand">
            KHOUSA
          </span>
          {subtitle && (
            <span className="mt-0.5 hidden truncate text-[0.7rem] text-muted-foreground sm:block">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
