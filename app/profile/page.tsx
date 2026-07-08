'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, User } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { normalizePhone } from '@/lib/auth/phone'

type ProfileUser = {
  id: string
  phone: string | null
  name: string | null
  email: string | null
  address: string | null
  area: string | null
  role: string
}

function toLocalPhone(phone: string | null | undefined) {
  if (!phone) return ''
  return phone.replace(/\D/g, '').replace(/^968/, '').slice(0, 8)
}

export default function ProfilePage() {
  const router = useRouter()
  const { dir, lang } = useLanguage()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [user, setUser] = React.useState<ProfileUser | null>(null)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [area, setArea] = React.useState('')
  const [address, setAddress] = React.useState('')

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  React.useEffect(() => {
    fetch('/api/profile')
      .then(async (res) => {
        if (!res.ok) {
          router.replace('/auth/login?redirect=/profile')
          return null
        }
        return res.json() as Promise<{ user: ProfileUser }>
      })
      .then((data) => {
        if (!data?.user) return
        setUser(data.user)
        setName(data.user.name || '')
        setEmail(data.user.email || '')
        setPhone(toLocalPhone(data.user.phone))
        setArea(data.user.area || '')
        setAddress(data.user.address || '')
      })
      .finally(() => setLoading(false))
  }, [router])

  const save = async () => {
    if (!name.trim()) {
      toast.error(t('الاسم مطلوب', 'Name is required'))
      return
    }

    const localPhone = phone.replace(/\D/g, '').slice(0, 8)
    let normalizedPhone: string | null = null
    if (localPhone) {
      normalizedPhone = normalizePhone(localPhone)
      if (!normalizedPhone) {
        toast.error(
          t(
            'أدخل رقم عُماني صحيح: 8 أرقام تبدأ بـ 7 أو 9',
            'Enter a valid Oman mobile: 8 digits starting with 7 or 9',
          ),
        )
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: normalizedPhone ?? '',
          area: area.trim(),
          address: address.trim(),
        }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string; user?: ProfileUser } | null
      if (!res.ok) throw new Error(data?.error || 'Failed to save')
      setUser(data!.user!)
      setName(data!.user!.name || '')
      setEmail(data!.user!.email || '')
      setPhone(toLocalPhone(data!.user!.phone))
      setArea(data!.user!.area || '')
      setAddress(data!.user!.address || '')
      toast.success(t('تم حفظ الملف الشخصي', 'Profile saved'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const logout = async () => {
    await Promise.all([
      authClient.signOut().catch(() => null),
      fetch('/api/phone/logout', { method: 'POST' }).catch(() => null),
    ])
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
          {t('جاري التحميل...', 'Loading...')}
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main dir={dir} className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-6" />
              </span>
              <div>
                <CardTitle>{t('ملفي الشخصي', 'My profile')}</CardTitle>
                <CardDescription>{user.email || user.phone || user.id}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>{t('الاسم الكامل', 'Full name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('البريد الإلكتروني', 'Email')}</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />
            </div>
            <div className="space-y-1" dir="ltr">
              <Label>{t('رقم الجوال', 'Phone number')}</Label>
              <div className="flex overflow-hidden rounded-lg border border-input">
                <span className="flex items-center gap-2 bg-muted/50 px-3 text-sm font-medium">
                  🇴🇲 +968
                </span>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="9XXXXXXX"
                  inputMode="tel"
                  maxLength={8}
                  className="border-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('المنطقة في مسقط', 'Area in Muscat')}</Label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('العنوان', 'Address')}</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={save} disabled={saving}>
                {saving ? t('جارٍ الحفظ...', 'Saving...') : t('حفظ', 'Save')}
              </Button>
              <Button variant="outline" render={<Link href="/subscriptions" />} nativeButton={false}>
                {t('اشتراكاتي', 'My subscriptions')}
              </Button>
              <Button variant="outline" render={<Link href="/booking" />} nativeButton={false}>
                {t('احجز خدمة', 'Book a service')}
              </Button>
              {user.role === 'admin' && (
                <Button variant="outline" render={<Link href="/admin" />} nativeButton={false}>
                  {t('لوحة الإدارة', 'Admin panel')}
                </Button>
              )}
              <Button variant="outline" onClick={logout}>
                <LogOut className="size-4" />
                {t('تسجيل الخروج', 'Logout')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}
