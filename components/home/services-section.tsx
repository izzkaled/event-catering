'use client'

import Link from 'next/link'
import { Users, Building2, Sparkles, MessageSquareHeart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

const features = [
  {
    icon: Building2,
    titleAr: 'جهات وشركات',
    titleEn: 'Gov & corporate',
    descAr: 'ضيافة تناسب المناسبات الرسمية والاجتماعات',
    descEn: 'Hospitality fit for official events and meetings',
  },
  {
    icon: Users,
    titleAr: 'باقات حسب الحضور',
    titleEn: 'By guest count',
    descAr: 'اختر الباقة وعدد الأشخاص بسهولة',
    descEn: 'Pick a package and guest count with ease',
  },
  {
    icon: MessageSquareHeart,
    titleAr: 'وسيط ينسّق عنك',
    titleEn: 'We coordinate',
    descAr: 'نستلم الطلب ونرتّب مع مزوّدي الضيافة',
    descEn: 'We receive the request and arrange catering partners',
  },
  {
    icon: Sparkles,
    titleAr: 'تجربة فاخرة',
    titleEn: 'Premium feel',
    descAr: 'هوية راقية وتنفيذ بذوق عالي',
    descEn: 'Refined brand and high-taste delivery',
  },
]

export function ServicesSection() {
  const { lang, t } = useLanguage()

  return (
    <section id="services" className="scroll-mt-20 border-t border-border bg-secondary/30 py-16 sm:py-20">
      <div className="site-container">
        <div className="mb-12 text-center">
          <p className="brand-kicker mb-3">Event Catering</p>
          <h2 className="font-brand text-3xl font-medium tracking-wide sm:text-4xl">{t('nav.services')}</h2>
          <p className="content-max mt-3 text-muted-foreground">{t('services.subtitle')}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.titleEn}
                className="group border-b border-border/80 pb-6 transition-colors hover:border-brand-sand/50"
              >
                <span className="mb-4 flex size-11 items-center justify-center rounded-full border border-brand-sand/30 bg-brand-sand/10 text-brand-palm transition-transform group-hover:scale-105">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-lg font-semibold tracking-tight">
                  {lang === 'ar' ? f.titleAr : f.titleEn}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {lang === 'ar' ? f.descAr : f.descEn}
                </p>
              </div>
            )
          })}
        </div>
        <div className="mt-12 text-center">
          <Button render={<Link href="/booking" />} nativeButton={false} size="lg" className="h-12 px-10 tracking-wide">
            {t('hero.cta')}
          </Button>
        </div>
      </div>
    </section>
  )
}
