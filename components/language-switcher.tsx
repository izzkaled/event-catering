'use client'

import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5 text-xs font-bold">
      <Button
        type="button"
        variant={lang === 'ar' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2.5"
        onClick={() => setLang('ar')}
      >
        AR
      </Button>
      <Button
        type="button"
        variant={lang === 'en' ? 'default' : 'ghost'}
        size="sm"
        className="h-7 px-2.5"
        onClick={() => setLang('en')}
      >
        EN
      </Button>
    </div>
  )
}
