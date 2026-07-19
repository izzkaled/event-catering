'use client'

import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
  size?: 'sm' | 'lg'
  className?: string
}

export function LanguageSwitcher({ size = 'sm', className }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage()
  const isLg = size === 'lg'

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        'inline-flex items-center rounded-xl border border-border/70 bg-secondary/50 p-0.5 shadow-sm',
        isLg ? 'text-sm' : 'text-xs',
        className,
      )}
    >
      {(['ar', 'en'] as const).map((code) => {
        const active = lang === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={cn(
              'rounded-[0.65rem] font-bold transition-all',
              isLg ? 'min-h-11 min-w-11 px-4' : 'min-h-8 min-w-[2.25rem] px-2 sm:min-h-7',
              active
                ? 'bg-background text-primary shadow-sm ring-1 ring-primary/20'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
            )}
          >
            {code.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
