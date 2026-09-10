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
      ? 'إيفنت كاترينج — ضيافة مصممة لمناسبتك، بكل تفاصيلها. للجهات والشركات والمناسبات الخاصة في عُمان.'
      : 'Event Catering — hospitality designed for your occasion. For government, corporate, and private events in Oman.'

  const quickLinks = [
    { href: '/packages', label: t('nav.packages') },
    { href: '/experience/find', label: lang === 'ar' ? 'اعثر على تجربتي' : 'Find My Experience' },
    { href: '/#how', label: t('nav.how') },
    { href: '/#contact', label: t('nav.contact') },
  ]

  return (
    <footer className="min-w-0 w-full overflow-x-clip border-t border-border bg-secondary/40">
      <div className="site-container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2">
          <BrandLogo size="md" full className="justify-start" />
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="mb-1.5 text-sm font-bold text-brand-palm">
            {lang === 'ar' ? 'روابط سريعة' : 'Quick links'}
          </h3>
          {quickLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="touch-target flex min-h-9 items-center text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
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
