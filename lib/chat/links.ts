import type { ChatSiteContext } from '@/lib/chat/site-context'

export type ChatAction = { label: string; href: string }

const MD_LINK = /\[([^\]]+)\]\((\/[^)\s]+|https?:\/\/[^)\s]+)\)/g

/** Pull markdown links into tappable action chips (deduped). */
export function extractChatActions(text: string): ChatAction[] {
  const seen = new Set<string>()
  const actions: ChatAction[] = []
  for (const match of text.matchAll(MD_LINK)) {
    const label = match[1]?.trim()
    const href = match[2]?.trim()
    if (!label || !href || seen.has(href)) continue
    seen.add(href)
    actions.push({ label, href })
    if (actions.length >= 4) break
  }
  return actions
}

/**
 * If the model mentioned a package name but forgot its book link,
 * append a clean markdown booking link once.
 */
export function enrichReplyWithPackageLinks(
  reply: string,
  ctx: ChatSiteContext,
  lang: 'ar' | 'en',
): string {
  let out = reply
  const extras: string[] = []

  for (const p of ctx.packages) {
    if (out.includes(p.book_url)) continue
    const name = lang === 'ar' ? p.name_ar : p.name_en
    if (!name || name.length < 4) continue
    if (!out.includes(name)) continue
    const label = lang === 'ar' ? `احجز: ${name}` : `Book: ${name}`
    extras.push(`[${label}](${p.book_url})`)
  }

  if (extras.length) {
    out = `${out.trim()}\n\n${extras.slice(0, 3).join('\n')}`
  }
  return out
}
