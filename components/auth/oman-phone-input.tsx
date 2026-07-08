'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type OmanPhoneInputProps = {
  value: string
  onChange: (localNumber: string) => void
  label?: string
  hint?: string
  autoFocus?: boolean
  onEnter?: () => void
  id?: string
}

/** Local 8-digit Oman mobile (starts with 7 or 9). Country code +968 shown separately. */
export function OmanPhoneInput({
  value,
  onChange,
  label,
  hint,
  autoFocus,
  onEnter,
  id = 'phone',
}: OmanPhoneInputProps) {
  const local = value.replace(/\D/g, '').slice(0, 8)

  return (
    <div className="space-y-1">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="flex overflow-hidden rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
        <div
          className="flex shrink-0 items-center gap-2 border-e border-input bg-muted/50 px-3 text-sm font-medium"
          title="Oman (+968)"
        >
          <span className="text-lg leading-none" aria-hidden>
            🇴🇲
          </span>
          <span className="tabular-nums text-foreground">+968</span>
        </div>
        <Input
          id={id}
          value={local}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
          placeholder="9XXXXXXX"
          inputMode="tel"
          autoFocus={autoFocus}
          maxLength={8}
          className="h-11 border-0 text-base shadow-none focus-visible:ring-0 sm:h-10 sm:text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEnter?.()
          }}
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
