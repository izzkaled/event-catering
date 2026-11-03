'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Phone, Mail, MapPin, ChevronDown } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import {
  IconFacebook,
  IconGoogleMaps,
  IconInstagram,
  IconTikTok,
  IconWhatsApp,
  PayApplePay,
  PayGooglePay,
  PayMastercard,
  PayVisa,
} from '@/components/brand-icons'
import { FooterSkyline } from '@/components/footer-skyline'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP || '96897021006').replace(/\D/g, '')
const PHONE_DISPLAY = '+968 9702 1006'
const EMAIL = 'Izzkaled@gmail.com'
const MAPS_URL = 'https://maps.google.com/?q=Muscat,Oman'
const INSTAGRAM =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || 'https://www.instagram.com/'
const FACEBOOK =
  process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim() || 'https://www.facebook.com/'
const TIKTOK = process.env.NEXT_PUBLIC_TIKTOK_URL?.trim() || 'https://www.tiktok.com/'

function SocialCircle({
  href,
  label,
  children,
  className,
}: {
  href: string
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        'grid size-11 place-items-center rounded-full bg-[var(--brand-cream)] text-[var(--ink-soft)] ring-1 ring-[var(--line)] transition hover:bg-brand-palm hover:text-white hover:ring-brand-palm',
        className,
      )}
    >
      {children}
    </a>
  )
}

function PaymentBadge({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <span
      title={title}
      className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-2 shadow-sm"
    >
      {children}
    </span>
  )
}

export function SiteFooter() {
  const { lang, t } = useLanguage()
  const isAr = lang === 'ar'

  const exploreLeft = [
    { href: '/packages', label: t('nav.packages') },
    { href: '/experience/find', label: isAr ? 'اعثر على تجربتي' : 'Find experience' },
    { href: '/#how', label: t('nav.how') },
    { href: '/profile', label: t('nav.profile') },
  ]

  const exploreRight = [
    { href: '/experience', label: t('nav.booking') },
    { href: '/#business', label: t('nav.business') },
    { href: '/faq', label: isAr ? 'الأسئلة الشائعة' : 'FAQ' },
    { href: '/admin/login', label: isAr ? 'دخول الموظفين' : 'Staff login' },
  ]

  const socials = (
    <>
      <li>
        <SocialCircle href={INSTAGRAM} label="Instagram" className="size-9 sm:size-11 [&_svg]:size-4 sm:[&_svg]:size-5">
          <IconInstagram className="size-5" />
        </SocialCircle>
      </li>
      <li>
        <SocialCircle href={FACEBOOK} label="Facebook" className="size-9 sm:size-11 [&_svg]:size-4 sm:[&_svg]:size-5">
          <IconFacebook className="size-5" />
        </SocialCircle>
      </li>
      <li>
        <SocialCircle href={TIKTOK} label="TikTok" className="size-9 sm:size-11 [&_svg]:size-4 sm:[&_svg]:size-5">
          <IconTikTok className="size-5" />
        </SocialCircle>
      </li>
      <li>
        <SocialCircle
          href={`https://wa.me/${WHATSAPP}`}
          label="WhatsApp"
          className="size-9 sm:size-11 [&_svg]:size-4 sm:[&_svg]:size-5"
        >
          <IconWhatsApp className="size-5" />
        </SocialCircle>
      </li>
      <li>
        <SocialCircle href={MAPS_URL} label="Google Maps" className="size-9 sm:size-11 [&_svg]:size-4 sm:[&_svg]:size-5">
          <IconGoogleMaps className="size-5" />
        </SocialCircle>
      </li>
    </>
  )

  return (
    <footer className="mt-12 min-w-0 w-full overflow-x-clip text-[var(--ink)] sm:mt-20">
      <div className="-mb-px overflow-hidden text-brand-palm" aria-hidden>
        <FooterSkyline className="mx-auto block h-auto w-full max-w-6xl overflow-visible" />
      </div>

      <div className="paper-grain border-t border-[var(--line)] bg-brand-cream">
        <div className="mx-auto max-w-6xl px-4 pt-4 pb-3 sm:pt-8 sm:pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Event Catering">
              <BrandLogo size="md" full className="justify-start" />
            </Link>
            <ul className="ms-auto flex flex-wrap gap-1.5 sm:hidden">{socials}</ul>
          </div>

          <p className="mt-3 text-[0.95rem] font-semibold leading-snug text-brand-palm">
            {isAr ? 'ضيافة مصممة لمناسبتك' : 'Hospitality designed for your occasion'}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
            {isAr
              ? 'ضيافة مناسبات عُمان • جهات حكومية • شركات • مناسبات خاصة'
              : 'Event hospitality Oman • Government • Corporate • Private'}
          </p>

          <ul className="mt-4 hidden flex-wrap gap-2 sm:flex">{socials}</ul>

          <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-2 lg:gap-10">
            <details className="group" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-xl font-bold leading-normal text-brand-palm marker:content-none lg:pointer-events-none [&::-webkit-details-marker]:hidden">
                <span>{isAr ? 'تصفّح' : 'Explore'}</span>
                <ChevronDown className="size-4 shrink-0 text-[var(--ink-muted)] transition-transform duration-200 group-open:rotate-180 lg:hidden" />
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2.5">
                <ul className="flex flex-col gap-2.5">
                  {exploreLeft.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-[15px] text-[var(--ink-soft)] transition hover:text-brand-palm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <ul className="flex flex-col gap-2.5">
                  {exploreRight.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-[15px] text-[var(--ink-soft)] transition hover:text-brand-palm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            <details className="group" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-xl font-bold leading-normal text-brand-palm marker:content-none lg:pointer-events-none [&::-webkit-details-marker]:hidden">
                <span>{t('nav.contact')}</span>
                <ChevronDown className="size-4 shrink-0 text-[var(--ink-muted)] transition-transform duration-200 group-open:rotate-180 lg:hidden" />
              </summary>
              <ul className="mt-3 flex flex-col gap-3.5 text-[15px]">
                <li>
                  <a
                    href={`tel:+${WHATSAPP}`}
                    className="flex items-start gap-2.5 text-[var(--ink-soft)] transition hover:text-brand-palm"
                  >
                    <Phone className="mt-0.5 size-4 shrink-0 text-brand-palm" strokeWidth={2} />
                    <span dir="ltr">{PHONE_DISPLAY}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="flex items-start gap-2.5 break-all text-[var(--ink-soft)] transition hover:text-brand-palm"
                  >
                    <Mail className="mt-0.5 size-4 shrink-0 text-brand-palm" strokeWidth={2} />
                    {EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 text-[var(--ink-soft)] transition hover:text-brand-palm"
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand-palm" strokeWidth={2} />
                    {t('footer.location')}
                  </a>
                </li>
              </ul>
            </details>
          </div>
        </div>

        <div className="border-t border-[var(--line)]">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-4 text-[0.7rem] text-[var(--ink-muted)] sm:gap-4 sm:text-xs">
            <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-center sm:text-start">
                © 2026 Event Catering. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
              </p>

              <nav
                aria-label={isAr ? 'المستندات القانونية' : 'Legal'}
                className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
              >
                <Link href="/privacy" className="transition hover:text-brand-palm">
                  {isAr ? 'سياسة الخصوصية' : 'Privacy'}
                </Link>
                <span aria-hidden className="text-[var(--line)]">
                  ·
                </span>
                <Link href="/terms" className="transition hover:text-brand-palm">
                  {isAr ? 'الشروط والأحكام' : 'Terms'}
                </Link>
              </nav>

              <p className="text-center sm:text-end">
                {isAr
                  ? 'جميع الأسعار بالريال العُماني وتشمل الضريبة'
                  : 'All prices are in OMR and include VAT'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="sr-only">{isAr ? 'طرق الدفع' : 'Payment methods'}</span>
              <PaymentBadge title={isAr ? 'فيزا' : 'Visa'}>
                <PayVisa className="h-3.5 w-auto" />
              </PaymentBadge>
              <PaymentBadge title={isAr ? 'ماستركارد' : 'Mastercard'}>
                <PayMastercard className="h-4 w-auto" />
              </PaymentBadge>
              <PaymentBadge title="Apple Pay">
                <PayApplePay className="h-4 w-auto" />
              </PaymentBadge>
              <PaymentBadge title="Google Pay">
                <PayGooglePay className="h-4 w-auto" />
              </PaymentBadge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
