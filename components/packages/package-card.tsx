'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check, Users } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { ExperiencePackage } from '@/lib/experience/types'
import { formatOmr } from '@/lib/experience/pricing'

type Props = {
  pkg: ExperiencePackage
  index?: number
  selected?: boolean
  onToggleCompare?: (id: string) => void
  compareDisabled?: boolean
}

/** Brand-aligned surface tones — plum / gold / cream / terracotta */
type Tone = 'plum' | 'gold' | 'cream' | 'sand'

function resolveTone(pkg: ExperiencePackage): Tone {
  if (pkg.is_popular) return 'gold'
  if (pkg.is_recommended || pkg.is_featured) return 'plum'
  const key = (pkg.category || pkg.slug || '').toLowerCase()
  if (/gov|حكوم|رسمي|official/.test(key)) return 'plum'
  if (/wed|عرس|حفل|celebrat|private|خاص/.test(key)) return 'sand'
  if (/corp|شرك|business|meeting|اجتماع/.test(key)) return 'cream'
  // Stable variety from slug
  const sum = [...(pkg.slug || pkg.id)].reduce((n, c) => n + c.charCodeAt(0), 0)
  return (['cream', 'sand', 'plum', 'gold'] as const)[sum % 4]
}

const tones: Record<
  Tone,
  {
    card: string
    category: string
    title: string
    price: string
    meta: string
    divider: string
    cta: string
    ghost: string
    badge: string
  }
> = {
  gold: {
    card: 'border-[#c8962e]/45 bg-gradient-to-b from-[#fff8ea] to-[#f7f1e7]',
    category: 'text-[#a67c2d]',
    title: 'text-[#3a1a3a] group-hover:text-[#4a234a]',
    price: 'text-[#4a234a]',
    meta: 'text-[#6b625c]',
    divider: 'border-[#c8962e]/30',
    cta: 'bg-gradient-to-br from-[#e0b45a] via-[#c8962e] to-[#a67c2d] text-[#2a122a] hover:brightness-[1.03]',
    ghost: 'border-[#c8962e]/45 bg-white/70 text-[#4a234a] hover:bg-[#fff8ea]',
    badge: 'bg-[#c8962e] text-[#2a122a]',
  },
  plum: {
    card: 'border-[#4a234a]/25 bg-gradient-to-b from-[#f3eaf3] to-[#f7f1e7]',
    category: 'text-[#4a234a]/75',
    title: 'text-[#4a234a] group-hover:text-[#2a122a]',
    price: 'text-[#4a234a]',
    meta: 'text-[#6b625c]',
    divider: 'border-[#4a234a]/15',
    cta: 'bg-[#4a234a] text-[#f7f1e7] hover:bg-[#3a1a3a]',
    ghost: 'border-[#4a234a]/25 bg-white/80 text-[#4a234a] hover:bg-[#f3eaf3]',
    badge: 'bg-[#4a234a] text-[#f7f1e7]',
  },
  cream: {
    card: 'border-[var(--line)] bg-white',
    category: 'text-[#6b625c]',
    title: 'text-[#1f1a17] group-hover:text-[#4a234a]',
    price: 'text-[#4a234a]',
    meta: 'text-[#6b625c]',
    divider: 'border-[var(--line)]',
    cta: 'bg-[#4a234a] text-[#f7f1e7] hover:bg-[#3a1a3a]',
    ghost: 'border-[#c8962e]/40 text-[#4a234a] hover:bg-[#f7f1e7]',
    badge: 'bg-[#c8962e] text-[#2a122a]',
  },
  sand: {
    card: 'border-[#b8915a]/35 bg-gradient-to-b from-[#faf4ea] via-[#f7f1e7] to-[#f3ebe0]',
    category: 'text-[#8a6a3a]',
    title: 'text-[#3a1a3a] group-hover:text-[#4a234a]',
    price: 'text-[#6b3d1f]',
    meta: 'text-[#6b625c]',
    divider: 'border-[#b8915a]/25',
    cta: 'bg-[#4a234a] text-[#f7f1e7] hover:bg-[#3a1a3a]',
    ghost: 'border-[#b8915a]/45 bg-[#fffaf3] text-[#4a234a] hover:bg-white',
    badge: 'bg-[#b8915a] text-[#f7f1e7]',
  },
}

export function PackageCard({ pkg, index = 0, selected, onToggleCompare, compareDisabled }: Props) {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'
  const name = isAr ? pkg.name_ar : pkg.name_en
  const tone = resolveTone(pkg)
  const t = tones[tone]
  const highlight = pkg.is_popular
    ? isAr
      ? 'الأكثر اختيارًا'
      : 'Most popular'
    : pkg.is_recommended
      ? isAr
        ? 'موصى بها'
        : 'Recommended'
      : null

  return (
    <article
      id={`package-${pkg.slug}`}
      style={{ ['--pkg-i' as string]: Math.min(index, 8) }}
      className={cn(
        'pkg-card group relative flex flex-col overflow-hidden rounded-xl border sm:rounded-2xl',
        t.card,
        'hover:shadow-[0_18px_40px_-20px_rgba(74,35,74,0.4)]',
      )}
    >
      {highlight && (
        <span
          aria-hidden
          className="pkg-live-ring pointer-events-none absolute inset-0 z-[1] rounded-[inherit] shadow-[inset_0_0_0_1px_rgba(200,150,46,0.55)]"
        />
      )}
      <span
        aria-hidden
        className="pkg-sheen pointer-events-none absolute inset-y-0 z-[2] w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent"
      />

      <Link href={`/packages/${pkg.slug}`} className="relative block aspect-[16/10] overflow-hidden">
        <div
          className="pkg-ken absolute inset-0"
          style={{ animationDelay: `${(index % 5) * -2.4}s` }}
        >
          <Image
            src={pkg.cover_image}
            alt={name}
            fill
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a122a]/50 via-transparent to-transparent" />

        {highlight && (
          <span
            className={cn(
              'pkg-badge-live absolute start-2.5 top-2.5 rounded-full px-2.5 py-1 font-ios text-[0.65rem] font-semibold shadow-sm',
              t.badge,
            )}
          >
            {highlight}
          </span>
        )}
      </Link>

      {onToggleCompare && (
        <button
          type="button"
          disabled={!selected && compareDisabled}
          onClick={() => onToggleCompare(pkg.id)}
          aria-pressed={selected}
          aria-label={
            selected
              ? isAr
                ? 'إزالة من المقارنة'
                : 'Remove from compare'
              : isAr
                ? 'أضف للمقارنة'
                : 'Add to compare'
          }
          className={cn(
            'absolute end-2.5 top-2.5 z-10 flex size-8 items-center justify-center rounded-full border backdrop-blur-sm transition',
            selected
              ? 'border-[#c8962e] bg-[#c8962e] text-[#2a122a]'
              : 'border-white/45 bg-black/30 text-white hover:bg-black/45',
            !selected && compareDisabled && 'opacity-40',
          )}
        >
          <Check className="size-3.5" strokeWidth={2.5} />
        </button>
      )}

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4 sm:pt-3.5">
        <p className={cn('font-ios text-[0.62rem] font-medium uppercase tracking-[0.16em]', t.category)}>
          {pkg.category}
        </p>

        <Link href={`/packages/${pkg.slug}`} className="mt-1 block">
          <h3
            className={cn(
              'font-ios text-[0.98rem] font-semibold leading-snug tracking-tight transition sm:text-[1.05rem]',
              t.title,
            )}
          >
            {name}
          </h3>
        </Link>

        <div className={cn('mt-3 flex items-end justify-between gap-2 border-t pt-3', t.divider)}>
          <div>
            <p className={cn('text-[0.65rem] font-medium uppercase tracking-[0.12em]', t.meta)}>
              {isAr ? 'يبدأ من' : 'From'}
            </p>
            <p className={cn('mt-0.5 font-ios text-lg font-semibold leading-none sm:text-xl', t.price)}>
              {formatOmr(pkg.base_price, lang)}
            </p>
          </div>
          <p className={cn('inline-flex items-center gap-1 pb-0.5 text-[0.72rem] sm:text-xs', t.meta)}>
            <Users className="size-3.5 opacity-70" strokeWidth={2} />
            {pkg.min_guests}–{pkg.max_guests}
          </p>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <Link
            href={`/experience?package=${pkg.slug}`}
            className={cn(
              'inline-flex h-9 flex-1 items-center justify-center rounded-full px-3 font-ios text-sm font-semibold transition',
              t.cta,
            )}
          >
            {isAr ? 'خصّص' : 'Customize'}
          </Link>
          <Link
            href={`/packages/${pkg.slug}`}
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-full border px-3.5 text-sm font-semibold transition',
              t.ghost,
            )}
          >
            {isAr ? 'التفاصيل' : 'Details'}
          </Link>
        </div>
      </div>
    </article>
  )
}
