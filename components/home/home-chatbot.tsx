'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarPlus, CreditCard, Loader2, MapPin, Package, Send, X } from 'lucide-react'
import { ChatCircle, X as PhosphorX } from '@phosphor-icons/react'
import { IconWhatsApp } from '@/components/brand-icons'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { ChatActionChips, ChatMessageContent } from '@/components/home/chat-message-content'
import { cn } from '@/lib/utils'
import type { ChatAction } from '@/lib/chat/links'

const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP || '96897021006').replace(/\D/g, '')

type ChatMsg = { id: string; role: 'user' | 'assistant'; content: string; actions?: ChatAction[] }

const SUGGESTIONS_AR = [
  { label: 'الباقات', text: 'ما هي أحدث باقات الضيافة والأسعار؟ أرسل روابط الطلب', icon: Package },
  { label: 'المناطق', text: 'أين تغطون الخدمة في مسقط؟', icon: MapPin },
  { label: 'الطلب', text: 'كيف أطلب باقة ضيافة؟', icon: CalendarPlus },
  { label: 'طلباتي', text: 'وين أحصل طلباتي؟', icon: CreditCard },
] as const

const SUGGESTIONS_EN = [
  { label: 'Packages', text: 'What are the latest hospitality packages and prices? Include request links.', icon: Package },
  { label: 'Areas', text: 'Which areas in Muscat do you cover?', icon: MapPin },
  { label: 'Request', text: 'How do I request a hospitality package?', icon: CalendarPlus },
  { label: 'My requests', text: 'Where can I find my requests?', icon: CreditCard },
] as const

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function ChatbotLogo({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/images/brand/logo-mark.webp"
      alt=""
      width={size}
      height={size}
      className={cn('rounded-full object-cover ring-1 ring-brand-sand/30', className)}
      style={{ width: size, height: size }}
      priority={false}
    />
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-0.5 py-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-brand-sand"
          style={{
            animation: 'khousa-chat-dot 1.1s ease-in-out infinite',
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </span>
  )
}

export function HomeChatbot() {
  const { lang, dir } = useLanguage()
  const ar = lang === 'ar'
  const [menuOpen, setMenuOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [customerName, setCustomerName] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const welcomed = useRef(false)

  function toggleLauncher() {
    if (open) {
      setOpen(false)
      setMenuOpen(false)
      return
    }
    setMenuOpen((v) => !v)
  }

  function openChat() {
    setMenuOpen(false)
    setOpen(true)
  }

  function closeAll() {
    setOpen(false)
    setMenuOpen(false)
  }

  const suggestions = ar ? SUGGESTIONS_AR : SUGGESTIONS_EN

  useEffect(() => {
    let cancelled = false
    fetch('/api/profile', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as { user?: { name?: string | null } }
      })
      .then((data) => {
        if (cancelled) return
        const full = data?.user?.name?.trim() || null
        const short = full ? full.split(/\s+/)[0] || full : null
        setCustomerName(short)
      })
      .catch(() => {
        if (!cancelled) setCustomerName(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!open) return

    let cancelled = false
    fetch('/api/profile', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as { user?: { name?: string | null } }
      })
      .then((data) => {
        if (cancelled) return
        const full = data?.user?.name?.trim() || null
        const short = full ? full.split(/\s+/)[0] || full : null
        setCustomerName(short)
      })
      .catch(() => null)

    if (!welcomed.current) {
      welcomed.current = true
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: ar
            ? 'أهلاً بك في إيفنت كاترينج\nأقدر أساعدك بالباقات والأسعار والمناطق وطلبات الضيافة خلال ثوانٍ.\nبماذا أبدأ؟'
            : 'Welcome to Event Catering\nI can help with packages, prices, areas, and hospitality requests in seconds.\nWhere shall we start?',
        },
      ])
    }

    const t = window.setTimeout(() => inputRef.current?.focus(), 200)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [open, ar])

  // Personalize welcome once profile name is known
  useEffect(() => {
    if (!open || !customerName || !welcomed.current) return
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0]?.id !== 'welcome') return prev
      return [
        {
          id: 'welcome',
          role: 'assistant',
          content: ar
            ? `أهلاً ${customerName}\nفرحانين نساعدك في إيفنت كاترينج — باقات، أسعار، مناطق، وطلبات ضيافة خلال ثوانٍ.\nبماذا أبدأ؟`
            : `Hi ${customerName}\nHappy to help at Event Catering — packages, prices, areas, and hospitality requests in seconds.\nWhere shall we start?`,
        },
      ]
    })
  }, [customerName, open, ar])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, open])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return

    const userMsg: ChatMsg = { id: newId(), role: 'user', content: trimmed }
    const nextHistory = [...messages, userMsg]
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setBusy(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          lang,
          history: nextHistory.slice(-8),
        }),
      })
      const data = (await res.json()) as {
        reply?: string
        customerName?: string | null
        actions?: ChatAction[]
      }
      if (data.customerName && !customerName) {
        setCustomerName(data.customerName)
      }
      const reply =
        data.reply ||
        (ar
          ? 'عذراً، تعذّر الرد الآن. جرّب مرة أخرى أو تواصل عبر واتساب.'
          : 'Sorry, I couldn’t reply just now. Try again or reach us on WhatsApp.')

      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          content: reply,
          actions: data.actions,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          content: ar
            ? 'حصل خلل بسيط في الاتصال. حاول مجدداً 🌿'
            : 'A small connection hiccup. Please try again 🌿',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      void send(input)
    })
  }

  return (
    <>
      {(open || menuOpen) && (
        <button
          type="button"
          aria-label={ar ? 'إغلاق' : 'Close'}
          className={cn(
            'fixed inset-0 z-[44] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            open
              ? 'bg-brand-palm/12 backdrop-blur-md'
              : 'bg-brand-palm/[0.04] backdrop-blur-[3px]',
          )}
          onClick={closeAll}
        />
      )}

      <div
        dir={dir}
        role="dialog"
        aria-hidden={!open}
        aria-label={ar ? 'مساعد إيفنت' : 'Event Helper'}
        className={cn(
          'fixed z-[46] start-3 sm:start-6',
          'bottom-[calc(8.75rem+env(safe-area-inset-bottom,0px))] md:bottom-[5.75rem]',
          'flex w-[min(20.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden',
          'rounded-2xl border border-white/45',
          'bg-brand-cream/55 shadow-[0_24px_60px_-18px_rgba(31,26,23,0.4)]',
          'backdrop-blur-2xl backdrop-saturate-150',
          'ring-1 ring-black/5',
          'origin-bottom transition-[opacity,transform,max-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open
            ? 'pointer-events-auto max-h-[min(28rem,64vh)] translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none max-h-0 translate-y-4 scale-[0.94] opacity-0',
        )}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,var(--brand-palm)_0%,#3a1c3a_55%,#5c2d4a_100%)] px-3.5 py-3.5 text-brand-cream">
          <div className="pointer-events-none absolute -end-6 -top-8 size-28 rounded-full bg-brand-sand/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="relative shrink-0">
              <ChatbotLogo size={46} className="ring-2 ring-brand-sand/55 shadow-lg" />
              <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-brand-palm bg-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-extrabold tracking-tight">
                {ar ? 'مساعد إيفنت' : 'Event Helper'}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-brand-sand/95">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {customerName
                  ? ar
                    ? `مرحباً ${customerName} · متصل`
                    : `Hi ${customerName} · Online`
                  : ar
                    ? 'متصل الآن · باقات حية'
                    : 'Online · Live packages'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeAll}
              className="touch-target flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              aria-label={ar ? 'إغلاق' : 'Close'}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="relative flex min-h-[11rem] flex-1 flex-col gap-3 overflow-y-auto bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--brand-sand)_12%,transparent),transparent_55%)] px-3 py-3.5"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex max-w-[90%] gap-2',
                m.role === 'user' ? 'ms-auto flex-row-reverse' : 'me-auto',
              )}
            >
              {m.role === 'assistant' && (
                <ChatbotLogo size={26} className="mt-1 shrink-0 shadow-sm ring-1 ring-brand-sand/25" />
              )}
              <div
                className={cn(
                  'px-3.5 py-2.5 text-[13px] leading-relaxed sm:text-sm',
                  m.role === 'user'
                    ? 'rounded-2xl rounded-be-md bg-brand-palm text-brand-cream shadow-md shadow-brand-palm/20'
                    : 'rounded-2xl rounded-bs-md border border-brand-sand/25 bg-card/95 text-foreground shadow-sm',
                )}
              >
                <ChatMessageContent text={m.content} tone={m.role} />
                {m.role === 'assistant' && m.actions && m.actions.length > 0 && (
                  <ChatActionChips actions={m.actions} onNavigate={() => setOpen(false)} />
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="me-auto flex items-center gap-2 rounded-2xl rounded-bs-md border border-brand-sand/25 bg-card px-3.5 py-2.5 shadow-sm">
              <ChatbotLogo size={22} />
              <TypingDots />
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-1.5 overflow-x-auto border-t border-brand-sand/15 bg-brand-cream/80 px-3 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggestions.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.label}
                type="button"
                disabled={busy}
                onClick={() => void send(s.text)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-sand/35 bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold text-brand-palm shadow-sm transition hover:border-brand-sand/60 hover:bg-brand-sand/15 disabled:opacity-50"
              >
                <Icon className="size-3 text-brand-terracotta" />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Composer */}
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 border-t border-brand-sand/20 bg-card/90 px-3 py-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            placeholder={ar ? 'اكتب سؤالك...' : 'Ask anything...'}
            className="min-w-0 flex-1 rounded-2xl border border-brand-sand/30 bg-background px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-brand-sand focus:ring-2 focus:ring-brand-sand/30"
            maxLength={500}
          />
          <Button
            type="submit"
            size="sm"
            disabled={busy || !input.trim() || pending}
            className="size-11 shrink-0 rounded-2xl bg-brand-palm p-0 text-brand-cream shadow-md shadow-brand-palm/25 hover:bg-brand-palm/90 disabled:opacity-40"
            aria-label={ar ? 'إرسال' : 'Send'}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>

        {/* CTA strip */}
        <div className="flex items-center justify-center border-t border-border/50 bg-secondary/40 px-3 py-2">
          <Link
            href="/packages"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-sand/20 px-3 py-1 text-[11px] font-bold text-brand-palm transition hover:bg-brand-sand/35"
          >
            <CalendarPlus className="size-3.5" />
            {ar ? 'جاهز؟ احجز باقتك الآن' : 'Ready? Book your package'}
          </Link>
        </div>
      </div>

      {/* Compact glass launcher — expands to WhatsApp + Chat */}
      <div
        className={cn(
          'fixed z-[45] start-3 sm:start-6',
          'bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6',
          'flex flex-col items-center',
        )}
      >
        <div
          className={cn(
            'relative flex flex-col items-center gap-2.5 rounded-[1.65rem] p-2',
            'transition-[background,box-shadow,backdrop-filter,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            menuOpen && !open
              ? 'border border-white/50 bg-white/35 shadow-[0_16px_40px_-16px_rgba(31,26,23,0.35)] backdrop-blur-xl backdrop-saturate-150 ring-1 ring-black/[0.04]'
              : 'border border-transparent bg-transparent shadow-none',
          )}
        >
          {/* Expanded actions */}
          <div
            className={cn(
              'flex flex-col items-center gap-2.5 overflow-hidden transition-[max-height,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
              menuOpen && !open
                ? 'pointer-events-auto mb-0.5 max-h-40 opacity-100'
                : 'pointer-events-none mb-0 max-h-0 opacity-0',
            )}
          >
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className={cn(
                'group flex flex-col items-center gap-1',
                menuOpen && !open && 'animate-helper-fab-in [animation-delay:40ms]',
              )}
              aria-label="WhatsApp"
            >
              <span className="rounded-full border border-white/40 bg-[#128C7E]/85 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm backdrop-blur-md">
                WhatsApp
              </span>
              <span className="flex size-11 items-center justify-center rounded-full bg-[#25D366]/95 text-white shadow-[0_8px_22px_-6px_rgba(37,211,102,0.55)] ring-1 ring-white/35 backdrop-blur-sm transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-active:scale-95">
                <IconWhatsApp className="size-5" />
              </span>
            </a>

            <button
              type="button"
              onClick={openChat}
              className={cn(
                'group flex flex-col items-center gap-1',
                menuOpen && !open && 'animate-helper-fab-in [animation-delay:110ms]',
              )}
              aria-label={ar ? 'محادثة المساعد' : 'Chat with assistant'}
            >
              <span className="rounded-full border border-white/50 bg-brand-cream/70 px-2 py-0.5 text-[9px] font-bold text-brand-palm shadow-sm backdrop-blur-md">
                {ar ? 'محادثة' : 'Chat'}
              </span>
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-palm/92 text-brand-cream shadow-[0_8px_22px_-6px_rgba(74,35,74,0.5)] ring-1 ring-white/30 backdrop-blur-sm transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-active:scale-95">
                <ChatCircle weight="fill" className="size-5" />
              </span>
            </button>
          </div>

          {!open && !menuOpen && (
            <span className="pointer-events-none absolute -top-7 rounded-full border border-white/45 bg-white/45 px-2 py-0.5 text-[9px] font-bold text-brand-palm shadow-md backdrop-blur-md transition-opacity duration-300">
              {ar ? 'مساعد إيفنت' : 'Event Helper'}
            </span>
          )}

          <button
            type="button"
            onClick={toggleLauncher}
            aria-expanded={menuOpen || open}
            aria-label={
              open || menuOpen
                ? ar
                  ? 'إغلاق'
                  : 'Close'
                : ar
                  ? 'فتح مساعد إيفنت'
                  : 'Open Event helper'
            }
            className={cn(
              'relative flex size-12 items-center justify-center overflow-hidden rounded-full',
              'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95',
              'shadow-[0_10px_26px_-8px_color-mix(in_srgb,var(--brand-palm)_42%,transparent)]',
              'ring-2 ring-white/55 ring-offset-2 ring-offset-transparent',
              open || menuOpen
                ? 'bg-brand-palm/90 text-brand-cream backdrop-blur-md ring-brand-palm/25'
                : 'bg-white/40 backdrop-blur-md',
            )}
          >
            {open || menuOpen ? (
              <PhosphorX
                weight="bold"
                className="size-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              />
            ) : (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-sand/15 [animation-duration:2.8s]" />
                <ChatbotLogo size={48} className="relative ring-0" />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
