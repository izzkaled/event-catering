'use client'

import { MessageSquare, Package, Settings2, Sparkles } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

const steps = [
  { icon: MessageSquare, titleKey: 'how.1.title' as const, descKey: 'how.1.desc' as const },
  { icon: Package, titleKey: 'how.2.title' as const, descKey: 'how.2.desc' as const },
  { icon: Settings2, titleKey: 'how.3.title' as const, descKey: 'how.3.desc' as const },
  { icon: Sparkles, titleKey: 'how.4.title' as const, descKey: 'how.4.desc' as const },
]

export function HowItWorks() {
  const { t } = useLanguage()

  return (
    <section id="how" className="scroll-mt-20 border-t border-border py-16 sm:py-20">
      <div className="site-container">
        <div className="max-w-2xl text-start">
          <p className="brand-kicker mb-3">How it works</p>
          <h2 className="text-balance font-ios text-3xl font-semibold tracking-tight sm:text-4xl">
            {t('how.title')}
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">{t('how.subtitle')}</p>
        </div>

        <div className="relative mt-14">
          <div className="absolute inset-x-8 top-7 hidden h-px bg-gradient-to-r from-transparent via-brand-sand/40 to-transparent lg:block" />
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.titleKey} className="relative flex flex-col gap-4 text-start">
                  <span className="relative z-10 flex size-14 items-center justify-center rounded-full border border-brand-sand/35 bg-card text-brand-palm shadow-sm">
                    <Icon className="size-6" strokeWidth={1.75} />
                    <span className="absolute -top-1 -end-1 flex size-6 items-center justify-center rounded-full bg-primary font-ios text-[11px] font-semibold text-primary-foreground">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </span>
                  <h3 className="font-ios text-base font-semibold tracking-tight">{t(step.titleKey)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t(step.descKey)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
