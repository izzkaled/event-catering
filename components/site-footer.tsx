'use client'

import Link from 'next/link'
import { Sparkles, Phone, Mail, MapPin } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96877222432'

export function SiteFooter() {
  const { lang, t } = useLanguage()

  const desc =
    lang === 'ar'
      ? 'خدمة تنظيف منزلي احترافية في مسقط وضواحيها. باقات مرنة بأسعار شفافة بالريال العُماني.'
      : 'Professional home cleaning in Muscat. Flexible packages with transparent OMR pricing.'

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </span>
            <span className="text-lg font-extrabold">Speedy Cleaning | نظافة بلس</span>
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold">روابط سريعة</h3>
          <Link href="/#services" className="text-sm text-muted-foreground hover:text-foreground">
            {t('nav.services')}
          </Link>
          <Link href="/booking" className="text-sm text-muted-foreground hover:text-foreground">
            {t('nav.booking')}
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold">تواصل معنا</h3>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Phone className="size-4 text-primary" />
            {t('footer.whatsapp')}: 77222432
          </a>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4 text-primary" />
            Izzkaled@gmail.com
          </span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            {t('footer.location')}
          </span>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-center text-sm text-muted-foreground">
          © 2026 Speedy Cleaning Services. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  )
}
