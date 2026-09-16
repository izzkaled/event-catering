'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'
import { IMAGE_SPECS, type ImageKind } from '@/lib/uploads/image-specs'

type Props = {
  kind: ImageKind
  value: string
  onChange: (url: string) => void
  label?: string
  className?: string
}

export function ImageUploadField({ kind, value, onChange, label, className }: Props) {
  const { tx, lang } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const spec = IMAGE_SPECS[kind]

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('kind', kind)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || tx('فشل الرفع', 'Upload failed'))
      }
      onChange(data.url)
      toast.success(tx('تم رفع الصورة', 'Image uploaded'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tx('فشل الرفع', 'Upload failed'))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <Label>{label}</Label> : null}
      <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
        <div
          className={cn(
            'relative bg-muted/40',
            kind === 'package_cover' ? 'aspect-[16/10]' : 'aspect-[4/3]',
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
              <ImagePlus className="size-8 opacity-60" />
              <p className="text-sm font-medium">{tx('لا توجد صورة', 'No image yet')}</p>
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="size-7 animate-spin text-brand-palm" />
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-foreground/6 bg-card p-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void upload(file)
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-10 flex-1 gap-1.5 sm:flex-none"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            {value ? tx('استبدال الصورة', 'Replace image') : tx('رفع صورة', 'Upload image')}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 gap-1.5 text-rose-700"
              disabled={uploading}
              onClick={() => onChange('')}
            >
              <Trash2 className="size-4" />
              {tx('إزالة', 'Remove')}
            </Button>
          ) : null}
        </div>
      </div>
      <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950 ring-1 ring-amber-200/70">
        <span className="font-semibold">{tx('ملاحظة المقاسات', 'Size note')}: </span>
        {lang === 'ar' ? spec.ar : spec.en}
      </p>
    </div>
  )
}
