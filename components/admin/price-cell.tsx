'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function PriceCell({
  value,
  onSave,
}: {
  value: string
  onSave: (price: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(value)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPrice(value)
  }, [value])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const save = async () => {
    if (price === value) {
      setEditing(false)
      return
    }
    setLoading(true)
    try {
      await onSave(price)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setLoading(false)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') {
            setPrice(value)
            setEditing(false)
          }
        }}
        className="h-8 w-24 text-center"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1 rounded px-2 py-1 font-bold hover:bg-secondary"
    >
      {parseFloat(value).toFixed(2)} OMR
      {loading && <Loader2 className="size-3 animate-spin" />}
      {saved && <Check className="size-3 text-primary" />}
    </button>
  )
}
