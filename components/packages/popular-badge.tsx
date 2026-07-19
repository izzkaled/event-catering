'use client'

import { Star } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function PopularBadge({ className }: { className?: string }) {
  const { t } = useLanguage()

  return (
    <Badge
      className={cn(
        'gap-1 border-emerald-400/40 bg-emerald-600 text-white shadow-sm hover:bg-emerald-600',
        className,
      )}
    >
      <Star className="size-3 fill-current text-emerald-100" />
      {t('packages.mostPopular')}
    </Badge>
  )
}
