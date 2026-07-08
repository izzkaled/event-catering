'use client'

import { Package, User, Calendar, CheckCircle, PartyPopper } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

const steps = [
  {
    icon: Package,
    titleAr: 'اختر الباقة',
    titleEn: 'Choose Package',
    descAr: 'حدد الساعات وزيارات الأسبوع المناسبة لمنزلك.',
    descEn: 'Pick hours and weekly visits that suit your home.',
  },
  {
    icon: User,
    titleAr: 'بياناتك',
    titleEn: 'Your Details',
    descAr: 'أدخل اسمك وجوالك وعنوانك في مسقط.',
    descEn: 'Enter your name, phone, and Muscat address.',
  },
  {
    icon: Calendar,
    titleAr: 'الموعد',
    titleEn: 'Schedule',
    descAr: 'اختر تاريخ البداية والوقت وأيام الأسبوع.',
    descEn: 'Choose start date, time, and preferred days.',
  },
  {
    icon: CheckCircle,
    titleAr: 'تأكيد',
    titleEn: 'Confirm',
    descAr: 'راجع الطلب وأكّد — الدفع عبر تحويل بنكي.',
    descEn: 'Review and confirm — pay by bank transfer.',
  },
  {
    icon: PartyPopper,
    titleAr: 'ابدأ الخدمة',
    titleEn: 'Get Started',
    descAr: 'يتواصل معك فريقنا خلال 24 ساعة.',
    descEn: 'Our team contacts you within 24 hours.',
  },
]

export function HowItWorks() {
  const { lang, t } = useLanguage()

  return (
    <section id="how" className="scroll-mt-20 border-t border-border py-16">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t('how.title')}
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">{t('how.subtitle')}</p>
        </div>

        <div className="relative mt-12">
          <div className="absolute top-8 right-8 left-8 hidden h-0.5 bg-border lg:block" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, i) => {
              const Icon = step.icon
              const title = lang === 'ar' ? step.titleAr : step.titleEn
              const desc = lang === 'ar' ? step.descAr : step.descEn
              return (
                <div
                  key={step.titleEn}
                  className="relative flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
                >
                  <span className="absolute -top-3.5 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md">
                    {i + 1}
                  </span>
                  <span className="mt-2 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-7" />
                  </span>
                  <h3 className="text-base font-bold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
