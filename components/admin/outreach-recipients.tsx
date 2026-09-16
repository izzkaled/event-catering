'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CheckSquare,
  FolderPlus,
  Plus,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/components/language-provider'

type CollectionSummary = {
  id: string
  name: string
  description: string | null
  contact_count: number
}

type Contact = {
  id: string
  email: string
  company_name: string | null
}

export function OutreachRecipients({
  emails,
  onEmailsChange,
  companyName,
  onCompanyNameChange,
}: {
  emails: string[]
  onEmailsChange: (emails: string[]) => void
  companyName: string
  onCompanyNameChange: (name: string) => void
}) {
  const { tx } = useLanguage()
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [emailDraft, setEmailDraft] = useState('')
  const [newCollectionName, setNewCollectionName] = useState('')
  const [loadingCollections, setLoadingCollections] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadCollections = useCallback(async () => {
    const res = await fetch('/api/admin/email-collections')
    if (!res.ok) {
      setLoadingCollections(false)
      return
    }
    const data = (await res.json()) as CollectionSummary[]
    setCollections(data)
    setLoadingCollections(false)
  }, [])

  useEffect(() => {
    loadCollections()
  }, [loadCollections])

  const loadCollection = async (id: string) => {
    setSelectedCollectionId(id)
    if (!id) {
      setContacts([])
      return
    }
    const res = await fetch(`/api/admin/email-collections/${id}`)
    if (!res.ok) {
      toast.error(tx('فشل تحميل المجموعة', 'Failed to load collection'))
      return
    }
    const data = await res.json()
    setContacts(data.contacts || [])
  }

  const addEmail = async () => {
    const value = emailDraft.trim().toLowerCase()
    if (!value) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error(tx('صيغة الإيميل غير صحيحة', 'Invalid email format'))
      return
    }
    if (!emails.includes(value)) {
      onEmailsChange([...emails, value])
    }
    setEmailDraft('')

    if (selectedCollectionId) {
      const res = await fetch(`/api/admin/email-collections/${selectedCollectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'merge',
          emails: [{ email: value, company_name: companyName || undefined }],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setContacts(data.contacts || [])
        loadCollections()
        toast.success(tx('حُفظ في المجموعة', 'Saved to collection'))
      }
    }
  }

  const createCollection = async () => {
    const name = newCollectionName.trim()
    if (!name) {
      toast.error(tx('أدخل اسم المجموعة', 'Enter a collection name'))
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/email-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          emails: emails.map((email) => ({ email, company_name: companyName || undefined })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || tx('فشل الإنشاء', 'Could not create'))
      toast.success(tx('تم إنشاء المجموعة وحفظ الإيميلات', 'Collection created and emails saved'))
      setNewCollectionName('')
      await loadCollections()
      await loadCollection(data.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx('فشل الإنشاء', 'Could not create'))
    } finally {
      setSaving(false)
    }
  }

  const saveToSelected = async () => {
    if (!selectedCollectionId) {
      toast.error(tx('اختر مجموعة أولاً أو أنشئ واحدة جديدة', 'Choose a collection first or create a new one'))
      return
    }
    if (!emails.length) {
      toast.error(tx('لا توجد إيميلات للحفظ', 'No emails to save'))
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/email-collections/${selectedCollectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'merge',
          emails: emails.map((email) => ({ email, company_name: companyName || undefined })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || tx('فشل الحفظ', 'Save failed'))
      setContacts(data.contacts || [])
      await loadCollections()
      toast.success(tx('تم حفظ الإيميلات في المجموعة', 'Emails saved to collection'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx('فشل الحفظ', 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const importCsv = async (file: File) => {
    let collectionId = selectedCollectionId
    if (!collectionId) {
      const name = newCollectionName.trim() || file.name.replace(/\.csv$/i, '') || tx('مجموعة CSV', 'CSV collection')
      const createRes = await fetch('/api/admin/email-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const created = await createRes.json()
      if (!createRes.ok) {
        toast.error(created.error || tx('فشل إنشاء مجموعة للاستيراد', 'Could not create a collection for import'))
        return
      }
      collectionId = created.id
      setNewCollectionName('')
      await loadCollections()
    }

    setImporting(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('mode', 'merge')
      const res = await fetch(`/api/admin/email-collections/${collectionId}/import`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || tx('فشل الاستيراد', 'Import failed'))
      toast.success(tx(`تم استيراد ${data.imported} إيميل (تم تخطي ${data.skipped})`, `Imported ${data.imported} email(s) (skipped ${data.skipped})`))
      await loadCollection(collectionId)
      await loadCollections()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx('فشل الاستيراد', 'Import failed'))
    } finally {
      setImporting(false)
    }
  }

  const toggleContact = (email: string) => {
    if (emails.includes(email)) {
      onEmailsChange(emails.filter((e) => e !== email))
    } else {
      onEmailsChange([...emails, email])
    }
  }

  const selectAllContacts = () => {
    const all = contacts.map((c) => c.email)
    onEmailsChange([...new Set([...emails, ...all])])
  }

  const clearSelectionFromCollection = () => {
    const set = new Set(contacts.map((c) => c.email))
    onEmailsChange(emails.filter((e) => !set.has(e)))
  }

  const deleteCollection = async () => {
    if (!selectedCollectionId) return
    if (!confirm(tx('حذف هذه المجموعة وكل إيميلاتها؟', 'Delete this collection and all of its emails?'))) return
    const res = await fetch(`/api/admin/email-collections/${selectedCollectionId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      toast.error(tx('فشل الحذف', 'Delete failed'))
      return
    }
    toast.success(tx('تم حذف المجموعة', 'Collection deleted'))
    setSelectedCollectionId('')
    setContacts([])
    loadCollections()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label>{tx('اسم الشركة (اختياري)', 'Company name (optional)')}</Label>
        <Input
          value={companyName}
          onChange={(e) => onCompanyNameChange(e.target.value)}
          placeholder={tx('مثال: شركة النور للعقارات', 'e.g. Al Noor Real Estate')}
        />
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="font-bold">{tx('المجموعات المحفوظة', 'Saved collections')}</Label>
          {loadingCollections && <span className="text-xs text-muted-foreground">…</span>}
        </div>

        <select
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={selectedCollectionId}
          onChange={(e) => loadCollection(e.target.value)}
        >
          <option value="">{tx('— اختر مجموعة —', '— Choose a collection —')}</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.contact_count})
            </option>
          ))}
        </select>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder={tx('اسم مجموعة جديدة', 'New collection name')}
            className="flex-1"
          />
          <Button type="button" variant="outline" disabled={saving} onClick={createCollection}>
            <FolderPlus className="size-4" />
            {tx('إنشاء وحفظ', 'Create & save')}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={saveToSelected}>
            {tx('حفظ المستلمين الحاليين في المجموعة', 'Save current recipients to collection')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-3.5" />
            {importing ? tx('جاري الرفع…', 'Uploading…') : tx('رفع CSV', 'Upload CSV')}
          </Button>
          {selectedCollectionId && (
            <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={deleteCollection}>
              <Trash2 className="size-3.5" />
              {tx('حذف المجموعة', 'Delete collection')}
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) importCsv(file)
              e.target.value = ''
            }}
          />
        </div>

        <p className="text-[11px] text-muted-foreground">
          {tx(
            'CSV: عمود email مطلوب، واختياري company / notes. إذا لم تختر مجموعة، يُنشئ واحدة تلقائياً من اسم الملف.',
            'CSV: email column is required; company / notes are optional. If no collection is selected, one is created from the file name.',
          )}
        </p>

        {contacts.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={selectAllContacts}>
                <CheckSquare className="size-3.5" />
                {tx(`اختيار الكل (${contacts.length})`, `Select all (${contacts.length})`)}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={clearSelectionFromCollection}>
                <Square className="size-3.5" />
                {tx('إلغاء اختيار المجموعة', 'Clear collection selection')}
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-background p-2">
              {contacts.map((c) => {
                const selected = emails.includes(c.email)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleContact(c.email)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted"
                  >
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                      }`}
                    >
                      {selected ? '✓' : ''}
                    </span>
                    <span className="ltr-data min-w-0 flex-1 truncate">
                      {c.email}
                    </span>
                    {c.company_name && (
                      <span className="truncate text-xs text-muted-foreground">{c.company_name}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>{tx('إضافة إيميل الآن', 'Add an email now')}</Label>
        <div className="flex gap-2">
          <Input
            className="input-en"
            dir="ltr"
            type="email"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            placeholder="company@example.com"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addEmail()
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addEmail}>
            <Plus className="size-4" />
          </Button>
        </div>
        {selectedCollectionId && (
          <p className="text-[11px] text-muted-foreground">{tx('يُحفظ تلقائياً في المجموعة المختارة.', 'Saved automatically to the selected collection.')}</p>
        )}
      </div>

      <div className="flex min-h-[72px] flex-wrap gap-2 rounded-xl border border-dashed border-border p-3">
        {emails.length === 0 && (
          <p className="w-full self-center text-center text-xs text-muted-foreground">
            {tx('لا مستلمين بعد — أضف أو اختر من مجموعة', 'No recipients yet — add one or pick from a collection')}
          </p>
        )}
        {emails.map((email) => (
          <Badge key={email} variant="secondary" className="ltr-data gap-1 font-normal">
            {email}
            <button
              type="button"
              className="ms-0.5 rounded-full p-0.5 hover:bg-muted"
              onClick={() => onEmailsChange(emails.filter((e) => e !== email))}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>

      {emails.length > 0 && (
        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onEmailsChange([])}>
          <Trash2 className="size-3.5" />
          {tx('مسح المستلمين الحاليين (بدون حذف من المجموعة)', 'Clear current recipients (does not delete from collection)')}
        </Button>
      )}
    </div>
  )
}
