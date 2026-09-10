'use client'

import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { useLanguage } from '@/components/language-provider'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'

export function SiteFooter() {
  const { lang, t } = useLanguage()

  const desc =
    lang === 'ar'
      ? 'إيفنت كاترينج — منصة وسيط ضيافة بالباقات للجهات الحكومية والشركات في عُمان. تنسيق احترافي وعروض واضحة.'
      : 'Event Catering — hospitality package intermediary for government and corporate in Oman. Professional coordination and clear offers.'

  return (
    <footer className="min-w-0 w-full overflow-x-clip border-t border-border bg-secondary/40">
      <div className="site-container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2">
          <BrandLogo size="md" full className="justify-start" />
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-brand-palm">
            {lang === 'ar' ? 'روابط سريعة' : 'Quick links'}
          </h3>
          <Link href="/#services" className="touch-target flex min-h-10 items-center text-sm text-muted-foreground hover:text-foreground">
            {t('nav.services')}
          </Link>
          <Link href="/booking" className="touch-target flex min-h-10 items-center text-sm text-muted-foreground hover:text-foreground">
            {t('nav.booking')}
          </Link>
          <Link href="/faq" className="touch-target flex min-h-10 items-center text-sm text-muted-foreground hover:text-foreground">
            {t('faq.nav')}
          </Link>
          <Link href="/#areas" className="touch-target flex min-h-10 items-center text-sm text-muted-foreground hover:text-foreground">
            {t('areas.title')}
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-brand-palm">
            {lang === 'ar' ? 'تواصل معنا' : 'Contact'}
          </h3>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Phone className="size-4 text-brand-terracotta" />
            {t('footer.whatsapp')}: 77222432
          </a>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4 text-brand-terracotta" />
            Izzkaled@gmail.com
          </span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-brand-terracotta" />
            {t('footer.location')}
          </span>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="site-container py-4 text-center text-sm text-muted-foreground">
          © 2026 Event Catering · إيفنت كاترينج —{' '}
          {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
        </div>
      </div>
    </footer>
  )
}
