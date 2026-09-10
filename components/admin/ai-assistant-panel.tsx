'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  Bot,
  Building2,
  ClipboardList,
  Copy,
  Lightbulb,
  Mail,
  MessageSquareText,
  Package,
  RefreshCw,
  Send,
  Sparkles,
  Check,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { OutreachRecipients } from '@/components/admin/outreach-recipients'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type AdminStats = {
  totalOrders: number
  totalRevenue: number
  statusCounts: Record<string, number>
  packageBreakdown: Record<string, number>
  areaBreakdown: Record<string, number>
  todayVisits: number
  monthVisits: number
}

type TabId = 'assist' | 'outreach' | 'packages'

type PackageProposal = {
  action: 'update' | 'create' | 'toggle_popular' | 'toggle_active' | 'create_section'
  package_id?: string | null
  package_name?: string | null
  rationale: string
  changes?: Record<string, unknown>
}

type ProposalRow = PackageProposal & {
  key: string
  status: 'pending' | 'applied' | 'dismissed' | 'error'
  error?: string
}

const assistActions = [
  {
    id: 'insights',
    label: 'حلّل الأداء',
    icon: BarChart3,
    prompt:
      'بناءً على أرقام لوحة التحكم، أعطني تحليلاً مختصراً لطلبات الضيافة: نقاط القوة، المخاطر، و3 إجراءات عملية هذا الأسبوع.',
  },
  {
    id: 'whatsapp',
    label: 'رد واتساب',
    icon: MessageSquareText,
    prompt:
      'اكتب 3 ردود واتساب جاهزة بالعربي: تأكيد استلام طلب ضيافة، إرسال عرض سعر نهائي، ومتابعة جهة لم ترد على العرض. قصيرة واحترافية.',
  },
  {
    id: 'packages',
    label: 'اقتراح باقات',
    icon: Lightbulb,
    prompt:
      'اقترح تحسينات على تسعير وعرض باقات الضيافة للجهات الحكومية والشركات في مسقط، مع فكرة باقة افتتاح وباقة اجتماعات.',
  },
  {
    id: 'orders',
    label: 'تذكير طلبات معلّقة',
    icon: ClipboardList,
    prompt:
      'اكتب نص تواصل قصير للطلبات المعلّقة (pending) لأرسله للجهة عبر واتساب أو إيميل لتأكيد العرض أو استكمال التفاصيل.',
  },
]

function buildSystemContext(stats: AdminStats | null) {
  const statsBlock = stats
    ? `
Live admin stats (use these numbers; do not invent data):
- Total orders: ${stats.totalOrders}
- Revenue (OMR): ${stats.totalRevenue.toFixed(2)}
- Status: ${JSON.stringify(stats.statusCounts)}
- Top packages: ${JSON.stringify(stats.packageBreakdown)}
- Areas: ${JSON.stringify(stats.areaBreakdown)}
- Visits today / month: ${stats.todayVisits} / ${stats.monthVisits}
`
    : 'No live stats available — give general Oman hospitality-intermediary advice.'

  return `You are Event Catering operations AI assistant for the business owner/admin in Muscat, Oman.

Your job: be clear, practical, and supportive — not decorative. Prefer short actionable steps, checklists, and ready-to-send copy.
Business: hospitality package intermediary for government & corporate (guest count × service hours), packages by occasion section, coordinate catering partners behind the scenes, Paymob + bank transfer, WhatsApp support.
${statsBlock}

Rules:
- Reply in the same language as the user (Arabic Gulf-friendly or English).
- If recommending prices, use OMR (indicative until final quote).
- Never claim you already sent an email — only draft text unless the admin uses the Outreach tab.
- Never claim you changed packages in the database — package edits happen only in the Packages tab after admin approval.
- Be honest about uncertainty.`
}

export function AIAssistantPanel() {
  const [tab, setTab] = useState<TabId>('assist')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Outreach state
  const [emails, setEmails] = useState<string[]>([])
  const [companyName, setCompanyName] = useState('')
  const [brief, setBrief] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [outreachLang, setOutreachLang] = useState<'ar' | 'en'>('ar')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)

  // Packages AI
  const [packageInstruction, setPackageInstruction] = useState('')
  const [packageSummary, setPackageSummary] = useState('')
  const [proposals, setProposals] = useState<ProposalRow[]>([])
  const [proposing, setProposing] = useState(false)
  const [applyingKey, setApplyingKey] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setStats({
          totalOrders: data.totalOrders ?? 0,
          totalRevenue: Number(data.totalRevenue ?? 0),
          statusCounts: data.statusCounts ?? {},
          packageBreakdown: data.packageBreakdown ?? {},
          areaBreakdown: data.areaBreakdown ?? {},
          todayVisits: data.todayVisits ?? 0,
          monthVisits: data.monthVisits ?? 0,
        })
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(
    async (text: string) => {
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
            prompt: `${buildSystemContext(stats)}\n\nConversation:\n${history}\n\nRespond as assistant:`,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'فشل الطلب')
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: data.text },
        ])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'فشل الطلب')
      } finally {
        setLoading(false)
      }
    },
    [loading, messages, stats],
  )

  const generateOutreach = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/outreach-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          companyName,
          brief,
          language: outreachLang,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل التوليد')
      setSubject(data.subject || '')
      setBody(data.body || '')
      toast.success('تم تجهيز مسودة الإيميل — راجعها قبل الإرسال')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل التوليد')
    } finally {
      setGenerating(false)
    }
  }

  const sendOutreach = async () => {
    if (!emails.length) {
      toast.error('أضف إيميل شركة واحد على الأقل')
      return
    }
    if (!subject.trim() || !body.trim()) {
      toast.error('أكمل الموضوع ونص الرسالة')
      return
    }
    if (!confirm(`إرسال الإيميل إلى ${emails.length} مستلم؟`)) return

    setSending(true)
    try {
      const res = await fetch('/api/admin/outreach-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          to: emails,
          subject,
          body,
          companyName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الإرسال')
      toast.success(`تم الإرسال إلى ${data.recipients?.length ?? emails.length} مستلم`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الإرسال')
    } finally {
      setSending(false)
    }
  }

  const readJson = async (res: Response) => {
    const text = await res.text()
    if (!text.trim()) {
      return { error: `رد فارغ من الخادم (${res.status})` } as {
        error?: string
        proposals?: PackageProposal[]
        summary?: string
        warning?: string
      }
    }
    try {
      return JSON.parse(text) as {
        error?: string
        proposals?: PackageProposal[]
        summary?: string
        success?: boolean
        warning?: string
      }
    } catch {
      return { error: 'تعذر قراءة رد الخادم' }
    }
  }

  const proposePackages = async (instruction?: string) => {
    const text = (instruction ?? packageInstruction).trim()
    if (!text) {
      toast.error('اكتب ماذا تريد تغييره في الباقات أو الأقسام')
      return
    }
    setProposing(true)
    try {
      const res = await fetch('/api/admin/ai-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'propose', instruction: text }),
      })
      const data = await readJson(res)
      if (!res.ok) throw new Error(data.error || 'فشل الاقتراح')
      const rows: ProposalRow[] = (data.proposals || []).map((p: PackageProposal) => ({
        ...p,
        key: crypto.randomUUID(),
        status: 'pending' as const,
      }))
      setPackageSummary(data.summary || '')
      setProposals(rows)
      if (!rows.length) toast.message('لا توجد اقتراحات')
      else toast.success(`${rows.length} اقتراح جاهز للمراجعة`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الاقتراح')
    } finally {
      setProposing(false)
    }
  }

  const applyProposal = async (row: ProposalRow) => {
    if (row.status === 'applied') return
    if (!confirm(`تطبيق هذا التعديل؟\n${row.rationale}`)) return
    setApplyingKey(row.key)
    try {
      const res = await fetch('/api/admin/ai-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          proposal: {
            action: row.action,
            package_id: row.package_id,
            package_name: row.package_name,
            rationale: row.rationale,
            changes: row.changes,
          },
        }),
      })
      const data = await readJson(res)
      if (!res.ok) throw new Error(data.error || 'فشل التطبيق')
      setProposals((prev) =>
        prev.map((p) => (p.key === row.key ? { ...p, status: 'applied' } : p)),
      )
      if (typeof data.warning === 'string' && data.warning) {
        toast.message(data.warning)
      } else {
        toast.success(row.action === 'create_section' ? 'تم إنشاء القسم' : 'تم تطبيق التعديل')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل التطبيق'
      setProposals((prev) =>
        prev.map((p) => (p.key === row.key ? { ...p, status: 'error', error: message } : p)),
      )
      toast.error(message)
    } finally {
      setApplyingKey(null)
    }
  }

  const actionLabel = (action: PackageProposal['action']) => {
    switch (action) {
      case 'create':
        return 'إنشاء باقة'
      case 'create_section':
        return 'إنشاء قسم'
      case 'toggle_popular':
        return 'الأكثر طلباً'
      case 'toggle_active':
        return 'تفعيل/تعطيل'
      default:
        return 'تحديث'
    }
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.06] via-background to-background p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Bot className="size-5" />
              </span>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">مساعد الإدارة الذكي</h1>
                <p className="text-sm text-muted-foreground">Event Catering · يدعم قراراتك اليومية</p>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              يحلل أرقامك، يقترح خطوات واضحة، يكتب ردوداً ونصوصاً، يعدّل الباقات بعد موافقتك، ويرسل
              إيميلات للشركات.
            </p>
          </div>
          {stats && (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Badge variant="secondary">{stats.totalOrders} طلب</Badge>
              <Badge variant="secondary">{stats.totalRevenue.toFixed(0)} OMR</Badge>
              <Badge variant="outline">{stats.statusCounts.pending ?? 0} معلّق</Badge>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-1 rounded-xl bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => setTab('assist')}
            className={cn(
              'flex flex-1 min-w-[30%] items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
              tab === 'assist' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            <Sparkles className="size-4" />
            العمليات
          </button>
          <button
            type="button"
            onClick={() => setTab('packages')}
            className={cn(
              'flex flex-1 min-w-[30%] items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
              tab === 'packages' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            <Package className="size-4" />
            الباقات
          </button>
          <button
            type="button"
            onClick={() => setTab('outreach')}
            className={cn(
              'flex flex-1 min-w-[30%] items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
              tab === 'outreach' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            <Building2 className="size-4" />
            بريد الشركات
          </button>
        </div>
      </div>

      {tab === 'assist' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ماذا تحتاج الآن؟</CardTitle>
            <CardDescription>
              اختر إجراءً سريعاً أو اكتب سؤالك. المساعد يستخدم إحصائيات لوحة التحكم عند التحليل.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {assistActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    type="button"
                    disabled={loading}
                    onClick={() => send(action.prompt)}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-start transition hover:border-primary/40 hover:bg-primary/[0.03] disabled:opacity-60"
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{action.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
                        {action.prompt.slice(0, 72)}…
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex max-h-[380px] min-h-[220px] flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-muted/20 p-4">
              {messages.length === 0 && (
                <div className="m-auto max-w-sm text-center text-sm text-muted-foreground">
                  <Bot className="mx-auto mb-2 size-8 text-primary/70" />
                  اسأل عن الطلبات، التسعير، التسويق، أو الصياغة. سأرد بخطوات قابلة للتنفيذ.
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={cn('flex gap-2', m.role === 'user' && 'justify-end')}>
                  {m.role === 'assistant' && <Bot className="mt-1 size-4 shrink-0 text-primary" />}
                  <div
                    className={cn(
                      'max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-background',
                    )}
                  >
                    {m.content}
                  </div>
                  {m.role === 'user' && <User className="mt-1 size-4 shrink-0" />}
                </div>
              ))}
              {loading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="size-3.5 animate-spin" />
                  جاري التفكير بناءً على بياناتك…
                </p>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="مثال: كيف أقلل الطلبات المعلّقة هذا الأسبوع؟"
                className="min-h-[44px] flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
              />
              <div className="flex flex-col gap-1">
                <Button onClick={() => send(input)} disabled={loading || !input.trim()} size="icon">
                  <Send className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!lastAssistant}
                  title="نسخ آخر رد"
                  onClick={() => {
                    if (!lastAssistant) return
                    navigator.clipboard.writeText(lastAssistant.content)
                    toast.success('تم النسخ')
                  }}
                >
                  <Copy className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!lastAssistant || loading}
                  title="أعد الصياغة"
                  onClick={() => send('اختصر ردك الأخير واجعله أوضح وأكثر قابلية للتنفيذ')}
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'packages' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4 text-primary" />
              تعديل الباقات بالذكاء الاصطناعي
            </CardTitle>
            <CardDescription>
              اكتب ماذا تريد للباقات أو الأقسام (مثل «أضف قسم غسيل») — راجع الاقتراح ثم طبّقه.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                'أضف قسم غسيل (Laundry) جديد',
                'حدّث أسعار الباقات لتكون أوضح وتنافسية في مسقط',
                'علّم باقة واحدة فقط كالأكثر طلباً',
                'اقترح باقة جديدة للشركات بـ 4 ساعات و3 أيام أسبوعياً',
              ].map((hint) => (
                <Button
                  key={hint}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={proposing}
                  onClick={() => {
                    setPackageInstruction(hint)
                    proposePackages(hint)
                  }}
                >
                  {hint.slice(0, 36)}…
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Label>طلبك</Label>
              <Textarea
                value={packageInstruction}
                onChange={(e) => setPackageInstruction(e.target.value)}
                placeholder="مثال: خفّض سعر باقة ساعتين بزيارتين أسبوعياً بنسبة 5%، واجعلها الأكثر طلباً"
                rows={3}
              />
            </div>

            <Button type="button" onClick={() => proposePackages()} disabled={proposing || !packageInstruction.trim()}>
              {proposing ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  جاري اقتراح التعديلات…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  اقترح التعديلات
                </>
              )}
            </Button>

            {packageSummary && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed">
                <strong className="font-bold">ملخص المساعد:</strong> {packageSummary}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {proposals.length === 0 && !proposing && (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  لا اقتراحات بعد. اكتب طلباً أو اختر مثالاً أعلاه.
                </p>
              )}

              {proposals.map((row) => (
                <div
                  key={row.key}
                  className={cn(
                    'rounded-xl border p-4',
                    row.status === 'applied' && 'border-emerald-300 bg-emerald-50/50',
                    row.status === 'dismissed' && 'opacity-50',
                    row.status === 'error' && 'border-destructive/40 bg-destructive/5',
                    row.status === 'pending' && 'border-border bg-card',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{actionLabel(row.action)}</Badge>
                        <span className="text-sm font-bold">
                          {row.package_name || (row.action === 'create' ? 'باقة جديدة' : 'باقة')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{row.rationale}</p>
                      {row.changes && Object.keys(row.changes).length > 0 && (
                        <pre
                          dir="ltr"
                          className="mt-2 overflow-x-auto rounded-lg bg-muted/60 p-2 text-[11px] leading-relaxed text-muted-foreground"
                        >
                          {JSON.stringify(row.changes, null, 2)}
                        </pre>
                      )}
                      {row.error && <p className="text-xs text-destructive">{row.error}</p>}
                    </div>
                    <div className="flex gap-1">
                      {row.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            disabled={applyingKey === row.key}
                            onClick={() => applyProposal(row)}
                          >
                            {applyingKey === row.key ? (
                              <RefreshCw className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                            تطبيق
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setProposals((prev) =>
                                prev.map((p) =>
                                  p.key === row.key ? { ...p, status: 'dismissed' } : p,
                                ),
                              )
                            }
                          >
                            تجاهل
                          </Button>
                        </>
                      )}
                      {row.status === 'applied' && (
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">تم</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'outreach' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4 text-primary" />
                مستلمو الشركات
              </CardTitle>
              <CardDescription>
                احفظ الإيميلات في مجموعات، ارفع CSV، واختر المستلمين ثم صِغ الرسالة.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <OutreachRecipients
                emails={emails}
                onEmailsChange={setEmails}
                companyName={companyName}
                onCompanyNameChange={setCompanyName}
              />

              <div className="flex flex-col gap-2">
                <Label>موجز للذكاء الاصطناعي</Label>
                <Textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="مثال: عرض ضيافة لاجتماع حكومي 50 شخص في بوشر"
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-border p-0.5">
                  <button
                    type="button"
                    onClick={() => setOutreachLang('ar')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-semibold',
                      outreachLang === 'ar' && 'bg-primary text-primary-foreground',
                    )}
                  >
                    عربي
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutreachLang('en')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-semibold',
                      outreachLang === 'en' && 'bg-primary text-primary-foreground',
                    )}
                  >
                    English
                  </button>
                </div>
                <Button type="button" onClick={generateOutreach} disabled={generating} className="flex-1 sm:flex-none">
                  {generating ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      جاري الصياغة…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      صياغة إيميل ذكي
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">المسودة قبل الإرسال</CardTitle>
              <CardDescription>عدّل النص بحرية — لن يُرسل شيء إلا بعد ضغط «إرسال».</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>الموضوع</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="موضوع الإيميل"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>نص الرسالة</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="سيظهر هنا نص الإيميل بعد الصياغة أو يمكنك كتابته يدوياً"
                  rows={12}
                  className="min-h-[220px]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!body}
                  onClick={() => {
                    navigator.clipboard.writeText(`${subject}\n\n${body}`)
                    toast.success('تم نسخ المسودة')
                  }}
                >
                  <Copy className="size-4" />
                  نسخ
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={sending || !emails.length || !subject.trim() || !body.trim()}
                  onClick={sendOutreach}
                >
                  {sending ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      جاري الإرسال…
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      إرسال إلى {emails.length || '—'} مستلم
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                يتطلب Resend مُعدّاً (`RESEND_API_KEY`). في الوضع التجريبي قد يقتصر الإرسال على إيميل
                حسابك حتى توثّق نطاقاً وتعيّن `RESEND_FROM_EMAIL`.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
