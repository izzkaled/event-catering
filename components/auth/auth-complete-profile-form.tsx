'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MapPin, User } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { OmanPhoneInput } from '@/components/auth/oman-phone-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MUSCAT_AREAS, MUSCAT_AREAS_EN } from '@/lib/constants'
import { normalizePhone } from '@/lib/auth/phone'
import { clearReturnTo, getReturnTo } from '@/lib/auth/session-storage'
import { isCustomerProfileComplete } from '@/lib/auth/profile-completeness'

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      {children}
    </span>
  )
}

export function AuthCompleteProfileForm() {
  const router = useRouter()
  const { dir, lang } = useLanguage()
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [area, setArea] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [checking, setChecking] = React.useState(true)

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)
  const areas = lang === 'ar' ? MUSCAT_AREAS : MUSCAT_AREAS_EN

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' })
        if (!res.ok) {
          router.replace('/auth/login')
          return
        }
        const data = (await res.json()) as {
          user?: { name?: string | null; phone?: string | null; area?: string | null }
        }
        if (cancelled) return
        if (isCustomerProfileComplete(data.user)) {
          const destination = getReturnTo('/profile')
          clearReturnTo()
          window.location.href = destination
          return
        }
        setName(data.user?.name?.trim() || '')
        const digits = (data.user?.phone || '').replace(/\D/g, '')
        setPhone(digits.startsWith('968') ? digits.slice(3, 11) : digits.slice(0, 8))
        setArea(data.user?.area || '')
      } catch {
        if (!cancelled) router.replace('/auth/login')
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  const submit = async () => {
    if (!name.trim()) {
      toast.error(t('الاسم مطلوب', 'Name is required'))
      return
    }
    const normalized = normalizePhone(phone)
    if (!normalized) {
      toast.error(
        t(
          'أدخل رقم عُماني صحيح: 8 أرقام تبدأ بـ 7 أو 9',
          'Enter a valid Oman mobile: 8 digits starting with 7 or 9',
        ),
      )
      return
    }
    if (!area.trim()) {
      toast.error(t('اختر المنطقة', 'Select your area'))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: normalized,
          area: area.trim(),
        }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) throw new Error(data?.error || t('تعذر الحفظ', 'Could not save'))

      toast.success(t('تم حفظ بياناتك', 'Your details were saved'))
      const destination = getReturnTo('/profile')
      clearReturnTo()
      window.location.href = destination
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('تعذر الحفظ', 'Could not save'))
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div dir={dir} className="site-container-compact py-10 text-center text-sm text-muted-foreground">
        {t('جارٍ التحميل...', 'Loading...')}
      </div>
    )
  }

  return (
    <div dir={dir} className="site-container-compact py-2 sm:py-10">
      <Card className="border-border/80 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-extrabold tracking-tight">
            {t('أكمل بياناتك', 'Complete your profile')}
          </CardTitle>
          <CardDescription className="text-base">
            {t(
              'نحتاج اسمك ورقم جوالك ومنطقتك لحفظها لطلبات الضيافة القادمة.',
              'We need your name, phone, and area so we can save them for future hospitality orders.',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="complete-name">{t('الاسم', 'Name')}</Label>
            <div className="relative">
              <FieldIcon>
                <User className="size-4" />
              </FieldIcon>
              <Input
                id="complete-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={loading}
                className="h-11 ps-10 text-base"
                placeholder={t('مثال: أحمد الهنائي', 'e.g. Ahmed Al-Hinai')}
              />
            </div>
          </div>

          <OmanPhoneInput
            id="complete-phone"
            value={phone}
            onChange={setPhone}
            label={t('رقم الجوال', 'Phone number')}
            hint={t('رقم عُماني للتواصل بخصوص الطلبات', 'Omani number for order updates')}
            onEnter={submit}
          />

          <div className="space-y-1.5">
            <Label htmlFor="complete-area">{t('من وين؟ (المنطقة)', 'Where from? (Area)')}</Label>
            <div className="relative">
              <FieldIcon>
                <MapPin className="size-4" />
              </FieldIcon>
              <select
                id="complete-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                disabled={loading}
                className="flex h-11 w-full appearance-none rounded-lg border border-input bg-background ps-10 pe-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <option value="">{t('اختر المنطقة في مسقط', 'Select area in Muscat')}</option>
                {areas.map((label, i) => (
                  <option key={MUSCAT_AREAS[i]} value={MUSCAT_AREAS[i]}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button className="h-11 w-full text-base shadow-md shadow-primary/15" onClick={submit} disabled={loading}>
            {loading ? t('جارٍ الحفظ...', 'Saving...') : t('حفظ والمتابعة', 'Save and continue')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
