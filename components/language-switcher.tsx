'use client'

import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
  size?: 'sm' | 'lg'
  className?: string
}

export function LanguageSwitcher({ size = 'sm', className }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage()
  const btnH = size === 'lg' ? 'h-11 min-w-11 px-4 text-sm' : 'h-8 px-2.5 sm:h-7'

  return (
    <div
      className={cn(
        'flex items-center rounded-lg border border-border bg-secondary/50 p-0.5 text-xs font-bold',
        className,
      )}
    >
      <Button
        type="button"
        variant={lang === 'ar' ? 'default' : 'ghost'}
        size="sm"
        className={btnH}
        onClick={() => setLang('ar')}
      >
        AR
      </Button>
      <Button
        type="button"
        variant={lang === 'en' ? 'default' : 'ghost'}
        size="sm"
        className={btnH}
        onClick={() => setLang('en')}
      >
        EN
      </Button>
    </div>
  )
}
