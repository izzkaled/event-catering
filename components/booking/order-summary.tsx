'use client'

import {
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Package,
  Phone,
  User,
} from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import type { Package as Pkg } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

const stripeEnabled = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim())

type OrderSummaryProps = {
  pkg: Pkg
  customerName?: string
  customerPhone?: string
  customerArea?: string
  customerAddress?: string
  startDate?: string
  preferredTime?: string
  preferredDays?: string[]
  compact?: boolean
}

export function OrderSummary({
  pkg,
  customerName,
  customerPhone,
  customerArea,
  customerAddress,
  startDate,
  preferredTime,
  preferredDays,
  compact = false,
}: OrderSummaryProps) {
  const { lang, t } = useLanguage()
  const name = lang === 'ar' ? pkg.name_ar : pkg.name_en
  const price = parseFloat(pkg.price_omr).toFixed(2)

  const sections = [
    {
      title: lang === 'ar' ? 'الاشتراك' : 'Subscription',
      icon: Package,
      rows: [
        { label: lang === 'ar' ? 'الباقة' : 'Package', value: name },
        {
          label: lang === 'ar' ? 'التفاصيل' : 'Details',
          value: `${pkg.hours_per_visit} ${t('booking.hours')} · ${pkg.visits_per_week} ${t('booking.visitsPerWeek')}`,
        },
      ],
    },
    ...(customerName || customerPhone || customerArea || customerAddress
      ? [
          {
            title: lang === 'ar' ? 'العميل' : 'Customer',
            icon: User,
            rows: [
              ...(customerName ? [{ label: t('booking.name'), value: customerName }] : []),
              ...(customerPhone ? [{ label: t('booking.phone'), value: customerPhone }] : []),
              ...(customerArea ? [{ label: t('booking.area'), value: customerArea }] : []),
              ...(customerAddress ? [{ label: t('booking.address'), value: customerAddress }] : []),
            ],
          },
        ]
      : []),
    ...(startDate || preferredTime || preferredDays?.length
      ? [
          {
            title: lang === 'ar' ? 'الموعد' : 'Schedule',
            icon: Calendar,
            rows: [
              ...(startDate ? [{ label: t('booking.date'), value: startDate }] : []),
              ...(preferredTime ? [{ label: t('booking.time'), value: preferredTime }] : []),
              ...(preferredDays?.length
                ? [{ label: t('booking.days'), value: preferredDays.join(' · ') }]
                : []),
            ],
          },
        ]
      : []),
  ]

  return (
    <div className={cn('flex flex-col', compact ? 'gap-4' : 'gap-5')}>
      {sections.map((section) => {
        const Icon = section.icon
        return (
          <div key={section.title} className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Icon className="size-3.5" />
              {section.title}
            </div>
            <div className="space-y-2 rounded-xl bg-secondary/40 p-3">
              {section.rows.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
                  <span className="shrink-0 text-muted-foreground">{row.label}</span>
                  <span className="text-end font-medium leading-snug">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <span className="font-bold">{t('booking.total')}</span>
          <div>
            <span className="text-2xl font-extrabold tabular-nums text-primary">{price}</span>
            <span className="ms-1 text-sm font-semibold text-muted-foreground">OMR</span>
          </div>
        </div>
        {!compact && (
          <div className="mt-3 flex items-start gap-2 border-t border-primary/15 pt-3 text-xs text-muted-foreground">
            <CreditCard className="mt-0.5 size-3.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                {stripeEnabled ? t('booking.payment_stripe') : t('booking.payment_method')}
              </p>
              <p className="mt-0.5">
                {stripeEnabled ? t('booking.payment_stripe_info') : t('booking.payment_info')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function BookingTrustBadges() {
  const { lang } = useLanguage()
  const items = [
    {
      icon: MapPin,
      ar: 'مسقط وضواحيها',
      en: 'Muscat & suburbs',
    },
    {
      icon: Clock,
      ar: 'مواعيد مرنة',
      en: 'Flexible schedule',
    },
    {
      icon: Phone,
      ar: 'تواصل خلال 24 ساعة',
      en: 'Contact within 24h',
    },
  ]

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <li key={item.en} className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Icon className="size-4 text-primary" />
            </span>
            {lang === 'ar' ? item.ar : item.en}
          </li>
        )
      })}
    </ul>
  )
}
