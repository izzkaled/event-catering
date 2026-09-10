'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ExperiencePackage } from '@/lib/experience/types'
import { formatOmr } from '@/lib/experience/pricing'

type Props = {
  pkg: ExperiencePackage
  selected?: boolean
  onToggleCompare?: (id: string) => void
  compareDisabled?: boolean
}

export function PackageCard({ pkg, selected, onToggleCompare, compareDisabled }: Props) {
  const { lang } = useLanguage()
  const name = lang === 'ar' ? pkg.name_ar : pkg.name_en
  const desc = lang === 'ar' ? pkg.description_ar : pkg.description_en
  const features = lang === 'ar' ? pkg.features_ar : pkg.features_en
  const visible = features.slice(0, 4)
  const more = Math.max(0, features.length - visible.length)
  const badge = lang === 'ar' ? pkg.badge_ar : pkg.badge_en
  const featured = pkg.is_popular || pkg.is_recommended

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-card/70 transition-all',
        featured
          ? 'border-brand-sand/55 shadow-[0_16px_48px_-28px_rgba(74,35,74,0.4)]'
          : 'border-border/80 hover:border-brand-sand/40 hover:shadow-[0_12px_40px_-24px_rgba(74,35,74,0.3)]',
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={pkg.cover_image}
          alt={name}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a122a]/55 via-transparent to-transparent" />
        {featured && (
          <span className="absolute start-3 top-3 rounded-full bg-brand-sand px-3 py-1 font-ios text-[0.7rem] font-semibold text-brand-palm">
            {pkg.is_popular
              ? lang === 'ar'
                ? 'الأكثر اختيارًا'
                : 'Most Popular'
              : lang === 'ar'
                ? 'موصى بها'
                : 'Recommended'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="font-ios text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {pkg.category}
          </p>
          <h3 className="mt-1 font-ios text-lg font-semibold tracking-tight text-foreground">{name}</h3>
          {badge && <p className="mt-1 text-sm font-medium text-brand-palm">{badge}</p>}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
        </div>

        <p className="text-sm text-muted-foreground">
          {lang === 'ar'
            ? `مصممة لـ ${pkg.min_guests}–${pkg.max_guests} ضيفًا`
            : `Designed for ${pkg.min_guests}–${pkg.max_guests} guests`}
        </p>

        <p className="font-ios text-base font-semibold text-foreground">
          {lang === 'ar' ? 'يبدأ من' : 'From'}{' '}
          <span className="text-primary">{formatOmr(pkg.base_price, lang)}</span>
        </p>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {lang === 'ar' ? 'تتضمن' : 'Includes'}
          </p>
          <ul className="space-y-1">
            {visible.map((f) => (
              <li key={f} className="text-sm text-foreground/90">
                · {f}
              </li>
            ))}
          </ul>
          {more > 0 && (
            <p className="mt-1 text-xs font-medium text-brand-palm">
              + {more} {lang === 'ar' ? 'المزيد' : 'more'}
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Button
            render={<Link href={`/experience?package=${pkg.slug}`} />}
            nativeButton={false}
            className="h-11 w-full rounded-full font-ios"
          >
            {lang === 'ar' ? 'خصص هذه التجربة' : 'Customize This Experience'}
          </Button>
          <Button
            render={<Link href={`/packages/${pkg.slug}`} />}
            nativeButton={false}
            variant="outline"
            className="h-10 w-full rounded-full font-ios text-sm"
          >
            {lang === 'ar' ? 'التفاصيل' : 'Details'}
          </Button>
          {onToggleCompare && (
            <button
              type="button"
              disabled={!selected && compareDisabled}
              onClick={() => onToggleCompare(pkg.id)}
              className={cn(
                'h-10 rounded-full border text-sm font-medium transition',
                selected
                  ? 'border-brand-sand bg-brand-sand/15 text-brand-palm'
                  : 'border-border text-muted-foreground hover:border-brand-sand/40',
                !selected && compareDisabled && 'opacity-40',
              )}
            >
              {selected
                ? lang === 'ar'
                  ? 'إزالة من المقارنة'
                  : 'Remove from compare'
                : lang === 'ar'
                  ? 'أضف للمقارنة'
                  : 'Compare'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
