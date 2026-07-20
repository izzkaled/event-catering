'use client'

import Link from 'next/link'
import { Clock, Calendar, Sparkles, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'

const features = [
  {
    icon: Clock,
    titleAr: '2–5 ساعات',
    titleEn: '2–5 Hours',
    descAr: 'باقات مرنة حسب حجم منزلك',
    descEn: 'Flexible packages for your home',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Calendar,
    titleAr: '1–5 زيارات/أسبوع',
    titleEn: '1–5 Visits/Week',
    descAr: 'جدول يناسب احتياجك',
    descEn: 'A schedule that fits your needs',
    color: 'bg-brand-sand/15 text-brand-sand',
  },
  {
    icon: Banknote,
    titleAr: 'أسعار بالريال العُماني',
    titleEn: 'Prices in OMR',
    descAr: 'بدون مفاجآت — سعر شهري واضح',
    descEn: 'No surprises — clear monthly pricing',
    color: 'bg-brand-terracotta/15 text-brand-terracotta',
  },
  {
    icon: Sparkles,
    titleAr: 'فريق محترف',
    titleEn: 'Professional Team',
    descAr: 'تنظيف موثوق في مسقط',
    descEn: 'Trusted cleaning in Muscat',
    color: 'bg-brand-palm/10 text-brand-palm',
  },
]

export function ServicesSection() {
  const { lang, t } = useLanguage()

  return (
    <section id="services" className="scroll-mt-20 border-t border-border bg-secondary/40 py-16">
      <div className="site-container">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">{t('nav.services')}</h2>
          <p className="content-max mt-2 text-muted-foreground">{t('services.subtitle')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.titleEn}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  className={`mb-4 flex size-12 items-center justify-center rounded-2xl ${f.color} transition-transform group-hover:scale-110`}
                >
                  <Icon className="size-6" />
                </span>
                <h3 className="text-lg font-bold">{lang === 'ar' ? f.titleAr : f.titleEn}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {lang === 'ar' ? f.descAr : f.descEn}
                </p>
              </div>
            )
          })}
        </div>
        <div className="mt-10 text-center">
          <Button render={<Link href="/booking" />} nativeButton={false} size="lg" className="h-12 px-10">
            {t('hero.cta')}
          </Button>
        </div>
      </div>
    </section>
  )
}
