'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { formatOmr } from '@/lib/experience/pricing'
import type { ExperiencePackage } from '@/lib/experience/types'

export function PackageDetail({ pkg }: { pkg: ExperiencePackage }) {
  const { lang } = useLanguage()
  const name = lang === 'ar' ? pkg.name_ar : pkg.name_en
  const desc = lang === 'ar' ? pkg.description_ar : pkg.description_en
  const features = lang === 'ar' ? pkg.features_ar : pkg.features_en

  return (
    <div>
      <div className="relative h-[min(52vh,28rem)] w-full overflow-hidden">
        <Image
          src={pkg.cover_image}
          alt={name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="site-container relative -mt-16 pb-16">
        <div className="max-w-3xl rounded-2xl border border-border/80 bg-background/95 p-6 shadow-lg backdrop-blur sm:p-8">
          <p className="brand-kicker mb-2">{pkg.category}</p>
          <h1 className="font-ios text-3xl font-semibold tracking-tight sm:text-4xl">{name}</h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-muted-foreground">{desc}</p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <span className="rounded-full border border-border px-3 py-1.5">
              {lang === 'ar'
                ? `${pkg.min_guests}–${pkg.max_guests} ضيفًا`
                : `${pkg.min_guests}–${pkg.max_guests} guests`}
            </span>
            <span className="rounded-full border border-border px-3 py-1.5 font-semibold text-primary">
              {lang === 'ar' ? 'يبدأ من' : 'From'} {formatOmr(pkg.base_price, lang)}
            </span>
          </div>

          <div className="mt-8">
            <h2 className="font-ios text-lg font-semibold">
              {lang === 'ar' ? 'تتضمن التجربة' : 'What’s included'}
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f} className="text-sm text-foreground/90">
                  · {f}
                </li>
              ))}
            </ul>
          </div>

          {pkg.gallery.length > 1 && (
            <div className="mt-8 grid grid-cols-2 gap-3">
              {pkg.gallery.map((src) => (
                <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image src={src} alt="" fill className="object-cover" sizes="40vw" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              render={<Link href={`/experience?package=${pkg.slug}`} />}
              nativeButton={false}
              size="lg"
              className="h-12 rounded-full px-8 font-ios"
            >
              {lang === 'ar' ? 'خصص تجربتك' : 'Customize Your Experience'}
            </Button>
            <Button
              render={<Link href="/packages" />}
              nativeButton={false}
              variant="outline"
              size="lg"
              className="h-12 rounded-full px-8 font-ios"
            >
              {lang === 'ar' ? 'استكشف الباقات' : 'Explore Packages'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
