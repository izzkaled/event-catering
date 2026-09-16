'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  Mail,
  MapPin,
  Shield,
  User,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { OmanPhoneInput } from '@/components/auth/oman-phone-input'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { authClient } from '@/lib/auth-client'
import { normalizePhone } from '@/lib/auth/phone'
import { MUSCAT_AREAS, MUSCAT_AREAS_EN } from '@/lib/constants'

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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function ProfileSkeleton() {
  return (
    <div className="site-container-wide animate-pulse space-y-6 py-10">
      <div className="h-36 rounded-2xl bg-muted" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-96 rounded-2xl bg-muted lg:col-span-2" />
        <div className="h-96 rounded-2xl bg-muted" />
      </div>
    </div>
  )
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
  const areas = lang === 'ar' ? MUSCAT_AREAS : MUSCAT_AREAS_EN
  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft

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
      <div className="page-shell flex min-h-screen flex-col">
        <SiteHeader />
        <main className="relative min-w-0 flex-1 overflow-x-clip">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <ProfileSkeleton />
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (!user) return null

  const quickLinks = [
    {
      href: '/subscriptions',
      icon: ClipboardList,
      title: t('طلباتي', 'My requests'),
      desc: t('تابع حالة الطلب والدفع', 'Track request and payment status'),
      accent: 'bg-primary/10 text-primary',
    },
    {
      href: '/packages',
      icon: CalendarDays,
      title: t('تصفح الباقات', 'Browse packages'),
      desc: t('اختر باقة وخصّص تجربتك', 'Choose a package and customize your experience'),
      accent: 'bg-primary/10 text-primary',
    },
  ]

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main dir={dir} className="relative min-w-0 flex-1 overflow-x-clip">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="pointer-events-none absolute -start-20 top-24 size-64 rounded-full bg-accent/10 blur-3xl" />

        <div className="site-container-wide relative py-6 sm:py-10">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 gap-1 text-muted-foreground"
            render={<Link href="/" />}
            nativeButton={false}
          >
            <BackIcon className="size-4" />
            {t('العودة للرئيسية', 'Back to home')}
          </Button>

          {/* Profile hero */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg shadow-primary/5">
            <div className="h-24 bg-gradient-to-br from-primary/90 via-primary to-primary/70 sm:h-28" />
            <div className="relative px-5 pb-5 sm:px-8 sm:pb-6">
              <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-primary text-2xl font-extrabold text-primary-foreground shadow-md sm:size-24 sm:text-3xl">
                    {getInitials(name || user.name || '?')}
                  </span>
                  <div className="pb-1">
                    <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {name || user.name || t('ملفي الشخصي', 'My profile')}
                    </h1>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {user.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3.5" />
                          {user.email}
                        </span>
                      )}
                      {user.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          <Shield className="size-3" />
                          {t('مدير', 'Admin')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="w-fit gap-2 self-start sm:self-auto">
                  <LogOut className="size-4" />
                  {t('تسجيل الخروج', 'Logout')}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Form */}
            <Card className="border-border/80 shadow-md lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="size-5 text-primary" />
                  {t('البيانات الشخصية', 'Personal details')}
                </CardTitle>
                <CardDescription>
                  {t('حدّث معلوماتك لتسريع الحجز القادم', 'Update your info to speed up your next booking')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="profile-name">{t('الاسم الكامل', 'Full name')}</Label>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('اسمك كما يظهر في الفاتورة', 'Name as shown on invoice')}
                      className="h-11 text-base sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-email">{t('البريد الإلكتروني', 'Email')}</Label>
                    <Input
                      id="profile-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      inputMode="email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-11 text-base sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <OmanPhoneInput
                      id="profile-phone"
                      label={t('رقم الجوال', 'Phone number')}
                      value={phone}
                      onChange={setPhone}
                      hint={t('8 أرقام تبدأ بـ 7 أو 9', '8 digits starting with 7 or 9')}
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                    <MapPin className="size-4 text-primary" />
                    {t('عنوان الخدمة', 'Service address')}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-area">{t('المنطقة في مسقط', 'Area in Muscat')}</Label>
                      <select
                        id="profile-area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-sm"
                      >
                        <option value="">{t('اختر المنطقة', 'Select area')}</option>
                        {areas.map((a, i) => (
                          <option key={a} value={MUSCAT_AREAS[i]}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="profile-address">{t('العنوان التفصيلي', 'Detailed address')}</Label>
                      <Textarea
                        id="profile-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        placeholder={t('الحي، الشارع، رقم المنزل...', 'District, street, house number...')}
                        className="min-h-[88px] resize-y"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={save}
                  disabled={saving}
                  className="h-11 w-full text-base shadow-md shadow-primary/15 sm:w-auto sm:min-w-40"
                >
                  {saving ? t('جارٍ الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save changes')}
                </Button>
              </CardContent>
            </Card>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-start gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${link.accent}`}>
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-bold group-hover:text-primary">{link.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{link.desc}</p>
                    </div>
                  </Link>
                )
              })}

              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="group flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 transition-all hover:bg-primary/10"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Shield className="size-5" />
                  </span>
                  <div>
                    <p className="font-bold">{t('لوحة الإدارة', 'Admin panel')}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t('إدارة الطلبات والعملاء', 'Manage orders and customers')}
                    </p>
                  </div>
                </Link>
              )}

              <Card className="border-dashed bg-muted/30">
                <CardContent className="flex items-start gap-3 p-5">
                  <Home className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(
                      'بياناتك تُستخدم تلقائياً عند الحجز. يمكنك تعديلها في أي وقت.',
                      'Your details are auto-filled when booking. You can edit them anytime.',
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
