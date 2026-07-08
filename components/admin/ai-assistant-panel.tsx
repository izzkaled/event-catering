'use client'

import { useState } from 'react'
import { Bot, Copy, RefreshCw, Send, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const suggestions = [
  'أنشئ خطة تسويقية',
  'اكتب حملة بريد إلكتروني',
  'اكتب منشور سوشيال ميديا',
  'حلل أداء الحملات',
  'اكتب مقال مدونة',
]

export function AIAssistantPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
    }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const history = next.map((m) => `${m.role}: ${m.content}`).join('\n')
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are CampaignHub AI marketing assistant for Speedy Cleaning (Oman cleaning service). Be concise and actionable. Respond in the same language as the user.\n\nConversation:\n${history}\n\nRespond as assistant:`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: data.text },
      ])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الطلب')
    } finally {
      setLoading(false)
    }
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')

  return (
    <Card id="ai-assistant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-5 text-primary" />
          مساعد الذكاء الاصطناعي (Gemini)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>
              {s}
            </Button>
          ))}
        </div>

        <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-border p-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              اسأل Gemini عن التسويق والمحتوى والحملات
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && <Bot className="mt-1 size-4 shrink-0 text-primary" />}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'user' && <User className="mt-1 size-4 shrink-0" />}
            </div>
          ))}
          {loading && <p className="text-sm text-muted-foreground">جاري التوليد...</p>}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="min-h-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
          />
          <div className="flex flex-col gap-1">
            <Button onClick={() => send(input)} disabled={loading} size="icon">
              <Send className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!lastAssistant}
              onClick={() => {
                if (lastAssistant) {
                  navigator.clipboard.writeText(lastAssistant.content)
                  toast.success('تم النسخ')
                }
              }}
            >
              <Copy className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!lastAssistant || loading}
              onClick={() => lastAssistant && send('أعد صياغة ردك الأخير بشكل أفضل')}
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
