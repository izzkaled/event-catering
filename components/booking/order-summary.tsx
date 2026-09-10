'use client'

import {
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Phone,
  User,
  Users,
} from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import type { Package as Pkg } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import { formatBookingDate } from '@/lib/booking/schedule'
import { formatGuests, formatServiceHours } from '@/lib/packages/semantics'

const paymobEnabled = Boolean(process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY?.trim())

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
      title: lang === 'ar' ? 'الباقة' : 'Package',
      icon: Package,
      rows: [
        { label: lang === 'ar' ? 'الباقة' : 'Package', value: name },
        {
          label: lang === 'ar' ? 'التفاصيل' : 'Details',
          value: `${formatGuests(pkg.visits_per_week, lang)} · ${formatServiceHours(pkg.hours_per_visit, lang)}`,
        },
      ],
    },
    ...(customerName || customerPhone || customerArea || customerAddress
      ? [
          {
            title: lang === 'ar' ? 'الجهة / المسؤول' : 'Organization / contact',
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
            title: lang === 'ar' ? 'المناسبة' : 'Event',
            icon: Calendar,
            rows: [
              ...(startDate
                ? [{ label: t('booking.date'), value: formatBookingDate(startDate, lang) }]
                : []),
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
                <div key={row.label} className="flex min-w-0 items-start justify-between gap-3 text-sm">
                  <span className="shrink-0 text-muted-foreground">{row.label}</span>
                  <span className="text-safe text-end font-medium leading-snug">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Users className="size-4" />
          {t('booking.total')}
        </span>
        <span className="text-xl font-extrabold tabular-nums text-primary">
          {price} <span className="text-sm font-semibold">OMR</span>
        </span>
      </div>

      {!compact && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <CreditCard className="mt-0.5 size-3.5 shrink-0" />
          {paymobEnabled
            ? t('booking.payment_info')
            : lang === 'ar'
              ? 'بعد المراجعة نؤكد العرض النهائي وطريقة الدفع.'
              : 'After review we confirm the final quote and payment method.'}
        </p>
      )}

      {!compact && customerArea && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          {customerArea}
          {customerAddress ? ` · ${customerAddress}` : ''}
        </p>
      )}

      {!compact && customerPhone && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Phone className="mt-0.5 size-3.5 shrink-0" />
          {customerPhone}
        </p>
      )}
    </div>
  )
}

export function BookingTrustBadges() {
  const { lang } = useLanguage()
  return (
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      <span className="rounded-full border border-border px-2.5 py-1">
        {lang === 'ar' ? 'رد خلال 24 ساعة' : 'Reply within 24h'}
      </span>
      <span className="rounded-full border border-border px-2.5 py-1">
        {lang === 'ar' ? 'تنسيق احترافي' : 'Pro coordination'}
      </span>
      <span className="rounded-full border border-border px-2.5 py-1">
        {lang === 'ar' ? 'عرض واضح' : 'Clear quote'}
      </span>
    </div>
  )
}
