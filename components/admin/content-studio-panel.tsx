'use client'

import { useState } from 'react'
import { Copy, Download, FileText, RefreshCw, Sparkles, Upload } from 'lucide-react'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const contentTypes = [
  'Email Campaign',
  'Blog Article',
  'Social Media Post',
  'Product Description',
  'Ad Copy',
  'Landing Page Content',
]

const tones = ['Professional', 'Friendly', 'Casual', 'Luxury', 'Corporate']

export function ContentStudioPanel() {
  const [topic, setTopic] = useState('')
  const [contentType, setContentType] = useState(contentTypes[0])
  const [tone, setTone] = useState(tones[0])
  const [language, setLanguage] = useState('Arabic')
  const [audience, setAudience] = useState('')
  const [keywords, setKeywords] = useState('')
  const [brandVoice, setBrandVoice] = useState('')
  const [length, setLength] = useState('Medium')
  const [cta, setCta] = useState('')
  const [details, setDetails] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const buildPrompt = () => `Create ${contentType} for Speedy Cleaning (professional cleaning service in Oman):
Topic: ${topic}
Tone: ${tone}
Language: ${language}
Audience: ${audience || 'General'}
Keywords: ${keywords || 'N/A'}
Brand Voice: ${brandVoice || 'N/A'}
Content Length: ${length}
CTA: ${cta || 'N/A'}
Additional Details: ${details || 'N/A'}
Write polished marketing copy ready to publish.`

  const generate = async () => {
    if (!topic.trim()) {
      toast.error('أدخل الموضوع')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setOutput(data.text)
      toast.success('تم توليد المحتوى')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل التوليد')
    } finally {
      setLoading(false)
    }
  }

  const selectClass = cn(
    'flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
  )

  const downloadTxt = () => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, 'content.txt')
  }

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    const lines = doc.splitTextToSize(output, 520)
    doc.text(lines, 40, 60)
    doc.save('content.pdf')
  }

  const exportDocx = async () => {
    const doc = new Document({
      sections: [
        {
          children: output
            .split('\n')
            .map((line) => new Paragraph({ children: [new TextRun(line)] })),
        },
      ],
    })
    const blob = await Packer.toBlob(doc)
    saveAs(blob, 'content.docx')
  }

  return (
    <Card id="content-studio">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          استوديو المحتوى (Gemini)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>الموضوع</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="عرض الصيف" />
          </div>
          <div className="space-y-1">
            <Label>نوع المحتوى</Label>
            <select className={selectClass} value={contentType} onChange={(e) => setContentType(e.target.value)}>
              {contentTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>النبرة</Label>
            <select className={selectClass} value={tone} onChange={(e) => setTone(e.target.value)}>
              {tones.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>اللغة</Label>
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>الجمهور المستهدف</Label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="أصحاب المنازل" />
          </div>
          <div className="space-y-1">
            <Label>الكلمات المفتاحية</Label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Brand Voice</Label>
            <Input value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} placeholder="Bold and helpful" />
          </div>
          <div className="space-y-1">
            <Label>Content Length</Label>
            <select className={selectClass} value={length} onChange={(e) => setLength(e.target.value)}>
              <option value="Short">Short</option>
              <option value="Medium">Medium</option>
              <option value="Long">Long</option>
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>دعوة للإجراء</Label>
            <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="احجز الآن" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Additional Details</Label>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} className="min-h-20" />
          </div>
        </div>

        <Button onClick={generate} disabled={loading} className="w-full">
          {loading ? 'جاري التوليد مع Gemini...' : 'توليد المحتوى'}
        </Button>

        {output && (
          <Textarea
            readOnly
            value={output}
            className="min-h-40 whitespace-pre-wrap"
          />
        )}

        {output && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(output); toast.success('تم النسخ') }}>
              <Copy className="size-3" /> نسخ
            </Button>
            <Button variant="outline" size="sm" onClick={generate}>
              <RefreshCw className="size-3" /> إعادة توليد
            </Button>
            <Button variant="outline" size="sm" onClick={downloadTxt}>
              <Download className="size-3" /> TXT
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPdf}>
              <FileText className="size-3" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => void exportDocx()}>
              <FileText className="size-3" /> DOCX
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Saved as template (next: persist in DB)')}
            >
              <FileText className="size-3" /> Save Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Publish queued (next: connect to scheduling/events)')}
            >
              <Upload className="size-3" /> Publish
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
