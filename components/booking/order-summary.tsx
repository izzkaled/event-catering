'use client'

import { useLanguage } from '@/components/language-provider'
import type { Package } from '@/lib/db/schema'

type OrderSummaryProps = {
  pkg: Package
  customerName?: string
  customerPhone?: string
  customerArea?: string
  customerAddress?: string
  startDate?: string
  preferredTime?: string
  preferredDays?: string[]
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
}: OrderSummaryProps) {
  const { lang, t } = useLanguage()
  const name = lang === 'ar' ? pkg.name_ar : pkg.name_en
  const price = parseFloat(pkg.price_omr).toFixed(2)

  const rows = [
    { label: lang === 'ar' ? 'الباقة' : 'Package', value: name },
    {
      label: lang === 'ar' ? 'التفاصيل' : 'Details',
      value: `${pkg.hours_per_visit} ${t('booking.hours')} | ${pkg.visits_per_week} ${t('booking.visitsPerWeek')} | ${pkg.visits_per_month} ${t('booking.visitsPerMonth')}`,
    },
    ...(customerName ? [{ label: t('booking.name'), value: customerName }] : []),
    ...(customerPhone ? [{ label: t('booking.phone'), value: customerPhone }] : []),
    ...(customerArea ? [{ label: t('booking.area'), value: customerArea }] : []),
    ...(customerAddress ? [{ label: t('booking.address'), value: customerAddress }] : []),
    ...(startDate ? [{ label: t('booking.date'), value: startDate }] : []),
    ...(preferredTime ? [{ label: t('booking.time'), value: preferredTime }] : []),
    ...(preferredDays?.length
      ? [{ label: t('booking.days'), value: preferredDays.join(', ') }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4">
          <span className="shrink-0 text-muted-foreground">{row.label}</span>
          <span className="text-left font-medium">{row.value}</span>
        </div>
      ))}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-base font-bold">
        <span>{t('booking.total')}</span>
        <span className="text-primary">{price} OMR</span>
      </div>
      <p className="text-xs text-muted-foreground">{t('booking.payment_method')}</p>
      <p className="text-xs text-muted-foreground">{t('booking.payment_info')}</p>
    </div>
  )
}
