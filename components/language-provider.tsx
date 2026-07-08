'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translations, type Lang, type TranslationKey } from '@/lib/i18n'

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
  dir: 'rtl' | 'ltr'
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved === 'ar' || saved === 'en') setLangState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    localStorage.setItem('lang', lang)
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const t = (key: TranslationKey) => translations[lang][key]

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
