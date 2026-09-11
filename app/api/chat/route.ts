import { NextResponse } from 'next/server'
import { getClientIp } from '@/lib/auth/rate-limit'
import { getSessionUser } from '@/lib/auth/get-session-user'
import { generateWithGemini } from '@/lib/gemini'
import { fallbackChatReply } from '@/lib/chat/fallback'
import { buildChatSiteContext, formatContextForPrompt } from '@/lib/chat/site-context'
import { extractChatActions, enrichReplyWithPackageLinks } from '@/lib/chat/links'

export const dynamic = 'force-dynamic'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const MAX_HISTORY = 8
const MAX_MESSAGE_LEN = 500
const CHAT_MAX = 30
const CHAT_WINDOW_MS = 10 * 60 * 1000
const chatAttempts = new Map<string, { count: number; firstAt: number }>()

function allowChat(ip: string): boolean {
  const now = Date.now()
  const entry = chatAttempts.get(ip)
  if (!entry || now - entry.firstAt > CHAT_WINDOW_MS) {
    chatAttempts.set(ip, { count: 1, firstAt: now })
    return true
  }
  entry.count += 1
  return entry.count <= CHAT_MAX
}

function firstName(full: string | null | undefined): string | null {
  const n = full?.trim()
  if (!n) return null
  return n.split(/\s+/)[0] || n
}

function buildSystemPrompt(lang: 'ar' | 'en', catalog: string, customerName: string | null) {
  const nameLine = customerName
    ? `The customer is logged in. Their registered name is "${customerName}". Address them by this name naturally. Do NOT invent other personal details.`
    : 'The customer is a guest (not logged in). Do not invent a name for them.'

  return `You are "مساعد إيفنت كاترينج" / "Event Catering Assistant" — a warm, clear assistant for Event Catering (إيفنت كاترينج), Oman hospitality packages.

Personality: gentle, clear, concise, never pushy. Short paragraphs. Bullet lists for packages.
Language: reply in ${lang === 'ar' ? 'Arabic' : 'English'} (default ${lang}).
Customer: ${nameLine}

LINK RULES (critical):
- Always guide with clickable markdown links: [label](/path)
- When recommending a specific package, include its PACKAGE_LINK, e.g. [خصص هذه التجربة](/packages/slug)
- Prefer customize: [صمّم تجربتك](/experience?package=slug)
- Never use old paths like /#packages or /booking?package=UUID for browsing packages
- "my requests" / طلباتي → [/subscriptions](/subscriptions)
- profile / حسابي → [/profile](/profile)
- login → [/auth/login](/auth/login)
- forgot password → [/auth/forgot](/auth/forgot)
- all packages → [/packages](/packages)
- find experience → [/experience/find](/experience/find)
- WhatsApp → use the WhatsApp URL from the catalog
- Never invent URLs. Only use paths from LIVE CATALOG.
- Prefer 1–3 clear links at the end of helpful answers.

Other rules:
- ONLY use facts from LIVE CATALOG. Do not invent packages, prices, or areas.
- Never ask for card numbers, OTP, or passwords.
- Keep answers under ~140 words unless listing packages.

LIVE CATALOG:
${catalog}`
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  if (!allowChat(ip)) {
    return NextResponse.json(
      { error: 'too_many_requests', reply: 'لحظة من فضلك — حاول بعد قليل 🌿' },
      { status: 429 },
    )
  }

  let body: { message?: unknown; lang?: unknown; history?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message || message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json({ error: 'invalid_message' }, { status: 400 })
  }

  const lang: 'ar' | 'en' = body.lang === 'en' ? 'en' : 'ar'
  const history = Array.isArray(body.history)
    ? (body.history as ChatMessage[])
        .filter(
          (m) =>
            m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.trim().length > 0,
        )
        .slice(-MAX_HISTORY)
        .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_LEN) }))
    : []

  const session = await getSessionUser().catch(() => null)
  const customerName = firstName(session?.name) || session?.name?.trim() || null

  const ctx = await buildChatSiteContext()
  const catalog = formatContextForPrompt(ctx)

  const historyBlock = history
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n')

  const prompt = `${buildSystemPrompt(lang, catalog, customerName)}

Conversation so far:
${historyBlock || '(new chat)'}

User: ${message}
Assistant:`

  try {
    const text = await generateWithGemini(prompt)
    let reply = text.trim()
    if (!reply) throw new Error('empty')
    reply = enrichReplyWithPackageLinks(reply, ctx, lang)
    const actions = extractChatActions(reply)
    return NextResponse.json({
      reply,
      actions,
      source: 'ai',
      packageCount: ctx.packages.length,
      customerName,
    })
  } catch (err) {
    console.error('[chat]', err instanceof Error ? err.message : err)
    const reply = fallbackChatReply(message, lang, ctx, customerName)
    const actions = extractChatActions(reply)
    return NextResponse.json({
      reply,
      actions,
      source: 'fallback',
      packageCount: ctx.packages.length,
      customerName,
    })
  }
}
