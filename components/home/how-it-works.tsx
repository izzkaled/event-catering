'use client'

import { Package, Send, Headphones, FileCheck, PartyPopper } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

const steps = [
  {
    icon: Package,
    titleAr: 'اختر الباقة',
    titleEn: 'Choose package',
    descAr: 'حدد مستوى الضيافة المناسب لمناسبتكم وعدد الحضور.',
    descEn: 'Pick the hospitality tier that fits your occasion and guests.',
  },
  {
    icon: Send,
    titleAr: 'أرسل الطلب',
    titleEn: 'Submit request',
    descAr: 'أدخل بيانات الجهة، الموقع، التاريخ والملاحظات.',
    descEn: 'Enter organization details, venue, date, and notes.',
  },
  {
    icon: Headphones,
    titleAr: 'نستلم وننسّق',
    titleEn: 'We coordinate',
    descAr: 'يصلنا إشعار فوري وننسّق مع مزوّدي الضيافة خلف الكواليس.',
    descEn: 'We get an instant alert and coordinate catering partners behind the scenes.',
  },
  {
    icon: FileCheck,
    titleAr: 'عرض وموافقة',
    titleEn: 'Quote & approval',
    descAr: 'نرد عليكم بالعرض النهائي أو الموافقة حسب المتطلبات.',
    descEn: 'We reply with a final quote or approval based on requirements.',
  },
  {
    icon: PartyPopper,
    titleAr: 'تنفيذ المناسبة',
    titleEn: 'Event delivery',
    descAr: 'تنفيذ الضيافة في الموعد المتفق عليه باحتراف.',
    descEn: 'Hospitality is delivered on the agreed date with care.',
  },
]

export function HowItWorks() {
  const { lang, t } = useLanguage()

  return (
    <section id="how" className="scroll-mt-20 border-t border-border py-16 sm:py-20">
      <div className="site-container">
        <div className="content-max text-center">
          <p className="brand-kicker mb-3">Process</p>
          <h2 className="text-balance font-brand text-3xl font-medium tracking-wide sm:text-4xl">
            {t('how.title')}
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">{t('how.subtitle')}</p>
        </div>

        <div className="relative mt-14">
          <div className="absolute inset-x-10 top-7 hidden h-px bg-gradient-to-r from-transparent via-brand-sand/40 to-transparent lg:block" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, i) => {
              const Icon = step.icon
              const title = lang === 'ar' ? step.titleAr : step.titleEn
              const desc = lang === 'ar' ? step.descAr : step.descEn
              return (
                <div key={step.titleEn} className="relative flex flex-col items-center gap-4 text-center">
                  <span className="relative z-10 flex size-14 items-center justify-center rounded-full border border-brand-sand/35 bg-card text-brand-palm shadow-sm">
                    <Icon className="size-6" />
                    <span className="absolute -top-1 -end-1 flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="text-base font-semibold tracking-tight">{title}</h3>
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
