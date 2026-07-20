'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ChatAction } from '@/lib/chat/links'

const MD_LINK = /\[([^\]]+)\]\((\/[^)\s]+|https?:\/\/[^)\s]+)\)/g

function isExternal(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
}

/** Renders assistant text with clickable markdown links. */
export function ChatMessageContent({
  text,
  tone = 'assistant',
}: {
  text: string
  tone?: 'assistant' | 'user'
}) {
  const parts: React.ReactNode[] = []
  let last = 0
  let key = 0

  for (const match of text.matchAll(MD_LINK)) {
    const full = match[0]
    const label = match[1]
    const href = match[2]
    const index = match.index ?? 0
    if (index > last) {
      parts.push(<span key={`t-${key++}`}>{text.slice(last, index)}</span>)
    }
    if (label && href) {
      const className = cn(
        'inline font-semibold underline underline-offset-2 decoration-brand-sand/70',
        tone === 'user' ? 'text-brand-cream' : 'text-brand-palm hover:text-brand-terracotta',
      )
      if (isExternal(href)) {
        parts.push(
          <a
            key={`a-${key++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {label}
          </a>,
        )
      } else {
        parts.push(
          <Link key={`a-${key++}`} href={href} className={className}>
            {label}
          </Link>,
        )
      }
    }
    last = index + full.length
  }

  if (last < text.length) {
    parts.push(<span key={`t-${key++}`}>{text.slice(last)}</span>)
  }

  return <span className="whitespace-pre-wrap">{parts.length ? parts : text}</span>
}

export function ChatActionChips({
  actions,
  onNavigate,
}: {
  actions: ChatAction[]
  onNavigate?: () => void
}) {
  if (!actions.length) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {actions.map((a) =>
        isExternal(a.href) ? (
          <a
            key={a.href}
            href={a.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
            className="inline-flex items-center rounded-full border border-brand-sand/45 bg-brand-sand/15 px-2.5 py-1 text-[11px] font-bold text-brand-palm transition hover:bg-brand-sand/30"
          >
            {a.label}
          </a>
        ) : (
          <Link
            key={a.href}
            href={a.href}
            onClick={onNavigate}
            className="inline-flex items-center rounded-full border border-brand-sand/45 bg-brand-sand/15 px-2.5 py-1 text-[11px] font-bold text-brand-palm transition hover:bg-brand-sand/30"
          >
            {a.label}
          </Link>
        ),
      )}
    </div>
  )
}
