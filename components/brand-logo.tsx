import Image from 'next/image'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  showText?: boolean
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { box: 'size-9', img: 36, text: 'text-sm' },
  md: { box: 'size-11', img: 44, text: 'text-base' },
  lg: { box: 'size-14', img: 56, text: 'text-lg' },
} as const

export function BrandLogo({
  className,
  imageClassName,
  showText = true,
  subtitle,
  size = 'sm',
}: BrandLogoProps) {
  const s = sizes[size]

  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <span
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-border/60',
          s.box,
          imageClassName,
        )}
      >
        <Image
          src="/logo.png"
          alt="Speedy Cleaning"
          width={s.img}
          height={s.img}
          className="size-full object-cover"
          priority
        />
      </span>
      {showText && (
        <span className="min-w-0 flex flex-col leading-tight">
          <span className={cn('truncate font-extrabold tracking-tight', s.text)}>
            <span className="sm:hidden">Speedy</span>
            <span className="hidden sm:inline">Speedy Cleaning</span>
          </span>
          {subtitle && (
            <span className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</span>
          )}
        </span>
      )}
    </span>
  )
}
