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
        'inline-flex items-center rounded-xl border border-[var(--line)] bg-white/75 p-0.5 shadow-sm backdrop-blur-sm',
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
              'rounded-lg font-bold tracking-wide transition-all duration-200',
              isLg ? 'min-h-11 min-w-11 px-4' : 'min-h-8 min-w-[2.35rem] px-2 sm:min-h-8',
              code === 'ar' ? 'font-ar' : 'font-en',
              active
                ? 'bg-brand-palm text-white shadow-sm'
                : 'text-[var(--ink-muted)] hover:bg-[var(--paper-deep)] hover:text-brand-palm',
            )}
          >
            {code.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
