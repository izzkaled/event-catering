'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translations, type Lang, type TranslationKey } from '@/lib/i18n'

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
  tx: (ar: string, en: string) => string
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
    const root = document.documentElement
    root.dir = lang === 'ar' ? 'rtl' : 'ltr'
    root.lang = lang
    root.classList.toggle('lang-ar', lang === 'ar')
    root.classList.toggle('lang-en', lang === 'en')
    localStorage.setItem('lang', lang)
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const t = (key: TranslationKey) => translations[lang][key]
  const tx = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, t, tx, dir: lang === 'ar' ? 'rtl' : 'ltr' }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
