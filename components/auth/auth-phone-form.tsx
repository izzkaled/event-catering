'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OmanPhoneInput } from '@/components/auth/oman-phone-input'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { normalizePhone } from '@/lib/auth/phone'
import { TurnstileWidget, isTurnstileConfigured } from '@/components/cloudflare/turnstile-widget'
import {
  getReturnTo,
  saveAuthMode,
  saveAuthName,
  saveAuthPhone,
  saveReturnTo,
} from '@/lib/auth/session-storage'

type AuthPhoneFormProps = {
  mode?: 'login' | 'signup'
  adminOnly?: boolean
}

export function AuthPhoneForm({ mode = 'login', adminOnly = false }: AuthPhoneFormProps) {
  const router = useRouter()
  const { dir, lang } = useLanguage()
  const [localPhone, setLocalPhone] = React.useState('')
  const [name, setName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null)

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  const continueToVerify = async () => {
    const normalized = normalizePhone(localPhone)
    if (!normalized) {
      toast.error(
        t(
          'أدخل رقم عُماني صحيح: 8 أرقام تبدأ بـ 7 أو 9',
          'Enter a valid Oman mobile: 8 digits starting with 7 or 9',
        ),
      )
      return
    }
    if (isTurnstileConfigured() && !turnstileToken) {
      toast.error(t('أكمل التحقق الأمني أولاً', 'Complete the security check first'))
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized, turnstileToken }),
      })
      const data = (await res.json().catch(() => null)) as {
        error?: string
        previewOtp?: string
        channel?: string
      } | null

      if (!res.ok) throw new Error(data?.error || 'Failed to send OTP')

      saveAuthPhone(normalized)
      saveAuthMode(mode)
      if (name.trim()) saveAuthName(name.trim())

      toast.success(
        t('تم إرسال رمز التحقق عبر SMS إلى جوالك', 'Verification code sent by SMS to your phone'),
      )

      router.push(adminOnly ? '/auth/verify?admin=1' : '/auth/verify')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir={dir} className="site-container-tight py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            {adminOnly
              ? t('تسجيل دخول لوحة الإدارة', 'Admin login')
              : mode === 'signup'
                ? t('إنشاء حساب', 'Create account')
                : t('تسجيل الدخول', 'Login')}
          </CardTitle>
          <CardDescription>
            {adminOnly
              ? t('أدخل رقم جوال الإدارة (+968)', 'Enter admin mobile (+968)')
              : mode === 'signup'
                ? t('أنشئ حسابك عبر Google أو رقم الجوال العُماني', 'Create account with Google or Oman mobile')
                : t('سجّل الدخول عبر Google أو رقم الجوال العُماني', 'Sign in with Google or Oman mobile')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!adminOnly && (
            <>
              <GoogleSignInButton />
              <div className="relative py-1 text-center text-xs text-muted-foreground">
                <span className="bg-card relative z-10 px-3">
                  {t('أو برقم الجوال', 'or with phone number')}
                </span>
                <span className="absolute inset-x-0 top-1/2 border-t border-border" />
              </div>
            </>
          )}

          <OmanPhoneInput
            value={localPhone}
            onChange={setLocalPhone}
            label={t('رقم الجوال', 'Phone number')}
            hint={t('مفتاح الدولة عُمان +968 — أدخل 8 أرقام فقط', 'Country code Oman +968 — enter 8 digits only')}
            autoFocus={adminOnly}
            onEnter={continueToVerify}
          />

          {mode === 'signup' && (
            <div className="space-y-1">
              <Label>{t('الاسم الكامل', 'Full name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}

          <Button className="w-full" onClick={continueToVerify} disabled={loading}>
            {loading ? t('جارٍ الإرسال...', 'Sending...') : t('متابعة', 'Continue')}
          </Button>

          <TurnstileWidget action="phone-otp" onToken={setTurnstileToken} />

          {!adminOnly && (
            <p className="text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  {t('ليس لديك حساب؟', "Don't have an account?")}{' '}
                  <Link href="/auth/signup" className="font-medium text-primary underline-offset-4 hover:underline">
                    {t('سجّل الآن', 'Sign up')}
                  </Link>
                </>
              ) : (
                <>
                  {t('لديك حساب؟', 'Already have an account?')}{' '}
                  <Link href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
                    {t('سجّل الدخول', 'Log in')}
                  </Link>
                </>
              )}
            </p>
          )}

          {!adminOnly && (
            <Button variant="outline" className="w-full" onClick={() => router.push(getReturnTo('/'))}>
              {t('إلغاء والعودة', 'Cancel and go back')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function useAuthRedirectSetup() {
  React.useEffect(() => {
    saveReturnTo()
  }, [])
}
