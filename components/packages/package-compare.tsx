'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { formatOmr } from '@/lib/experience/pricing'
import type { ExperiencePackage } from '@/lib/experience/types'

export function PackageCompare({
  packages,
  onClose,
}: {
  packages: ExperiencePackage[]
  onClose: () => void
}) {
  const { lang } = useLanguage()

  const rows = [
    {
      label: lang === 'ar' ? 'السعر يبدأ من' : 'Price from',
      value: (p: ExperiencePackage) => formatOmr(p.base_price, lang),
    },
    {
      label: lang === 'ar' ? 'الضيوف' : 'Guests',
      value: (p: ExperiencePackage) => `${p.min_guests}–${p.max_guests}`,
    },
    {
      label: lang === 'ar' ? 'المشروبات والضيافة' : 'Food & Beverage',
      value: (p: ExperiencePackage) =>
        String(p.included_service_ids.filter((id) => ['arabic-coffee', 'tea', 'dates', 'water', 'juices', 'desserts', 'canapes', 'buffet'].includes(id)).length),
    },
    {
      label: lang === 'ar' ? 'التجهيز' : 'Setup',
      value: (p: ExperiencePackage) =>
        String(p.included_service_ids.filter((id) => ['tables', 'chairs', 'serving-station', 'decorative-setup', 'welcome-area'].includes(id)).length),
    },
    {
      label: lang === 'ar' ? 'الطاقم' : 'Staff',
      value: (p: ExperiencePackage) =>
        String(p.included_service_ids.filter((id) => ['servers', 'hosts', 'supervisors', 'event-staff'].includes(id)).length),
    },
    {
      label: lang === 'ar' ? 'قابل للتخصيص' : 'Customization',
      value: () => (lang === 'ar' ? 'نعم' : 'Yes'),
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-t-2xl bg-background p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-ios text-xl font-semibold">
            {lang === 'ar' ? 'مقارنة الباقات' : 'Compare packages'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-secondary" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-start font-medium text-muted-foreground" />
                {packages.map((p) => (
                  <th key={p.id} className="p-3 text-start font-ios font-semibold">
                    {lang === 'ar' ? p.name_ar : p.name_en}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border/70">
                  <td className="p-3 text-muted-foreground">{row.label}</td>
                  {packages.map((p) => (
                    <td key={p.id} className="p-3 font-medium">
                      {row.value(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {packages.map((p) => (
            <Button
              key={p.id}
              render={<Link href={`/packages/${p.slug}`} />}
              nativeButton={false}
              className="h-10 rounded-full px-4 font-ios"
            >
              {lang === 'ar' ? p.name_ar : p.name_en}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
