'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

export type LegalSection = {
  id: string
  titleAr: string
  titleEn: string
  bodyAr: ReactNode
  bodyEn: ReactNode
}

type Props = {
  kickerAr: string
  kickerEn: string
  titleAr: string
  titleEn: string
  introAr: string
  introEn: string
  updatedAr: string
  updatedEn: string
  sections: LegalSection[]
  related?: { href: string; labelAr: string; labelEn: string }[]
}

export function LegalDoc({
  kickerAr,
  kickerEn,
  titleAr,
  titleEn,
  introAr,
  introEn,
  updatedAr,
  updatedEn,
  sections,
  related = [],
}: Props) {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  return (
    <>
      <div className="border-b border-[var(--line)] bg-[var(--paper-deep)]/55">
        <div className="site-container py-10 sm:py-14">
          <p className="text-sm font-semibold tracking-wide text-brand-sand">
            {isAr ? kickerAr : kickerEn}
          </p>
          <h1 className="mt-2 max-w-3xl font-ios text-3xl font-semibold tracking-tight text-brand-palm sm:text-4xl">
            {isAr ? titleAr : titleEn}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--ink-muted)] leading-relaxed">
            {isAr ? introAr : introEn}
          </p>
          <p className="mt-4 text-xs font-medium text-[var(--ink-muted)]">
            {isAr ? updatedAr : updatedEn}
          </p>
        </div>
      </div>

      <div className="site-container grid gap-10 py-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14 lg:py-14">
        <nav
          aria-label={isAr ? 'أقسام الصفحة' : 'Page sections'}
          className="hidden lg:block"
        >
          <ul className="sticky top-28 space-y-1.5 border-s border-[var(--line)] ps-3">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block py-1 text-sm text-[var(--ink-muted)] transition hover:text-brand-palm"
                >
                  {isAr ? s.titleAr : s.titleEn}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="font-ios text-xl font-semibold tracking-tight text-brand-palm sm:text-2xl">
                {isAr ? s.titleAr : s.titleEn}
              </h2>
              <div
                className={cn(
                  'mt-3 space-y-3 text-[0.98rem] leading-relaxed text-[var(--ink-soft)]',
                  '[&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:ps-5',
                  '[&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:ps-5',
                  '[&_a]:font-semibold [&_a]:text-brand-palm [&_a]:underline-offset-4 hover:[&_a]:underline',
                  '[&_strong]:font-semibold [&_strong]:text-[var(--ink)]',
                )}
              >
                {isAr ? s.bodyAr : s.bodyEn}
              </div>
            </section>
          ))}

          {related.length > 0 && (
            <div className="rounded-2xl border border-[var(--line)] bg-white px-4 py-4 sm:px-5">
              <p className="text-sm font-semibold text-brand-palm">
                {isAr ? 'مستندات ذات صلة' : 'Related documents'}
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {related.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} className="font-semibold text-brand-palm underline-offset-4 hover:underline">
                      {isAr ? r.labelAr : r.labelEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </div>
    </>
  )
}
