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
import { authClient } from '@/lib/auth-client'
import { normalizePhone } from '@/lib/auth/phone'

type Mode = 'login' | 'signup'

type PhoneOtpFormProps = {
  mode: Mode
  title?: string
  description?: string
  redirectTo?: string
  adminOnly?: boolean
  initialPhone?: string
}

export function PhoneOtpForm({
  mode,
  title,
  description,
  redirectTo = '/profile',
  adminOnly = false,
  initialPhone = '',
}: PhoneOtpFormProps) {
  const router = useRouter()
  const { dir, lang } = useLanguage()
  const [step, setStep] = React.useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = React.useState(initialPhone)
  const [code, setCode] = React.useState('')
  const [name, setName] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  const sendOtp = async () => {
    const normalized = normalizePhone(phone.trim())
    if (!normalized) {
      toast.error(t('رقم جوال عُماني غير صالح', 'Invalid Omani phone number'))
      return
    }
    if (mode === 'signup' && !name.trim()) {
      toast.error(t('أدخل الاسم', 'Enter your name'))
      return
    }

    setLoading(true)
    try {
      const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: normalized })
      if (error) throw new Error(error.message || 'Failed to send OTP')

      toast.success(
        lang === 'ar'
          ? 'تم إرسال الرمز إلى بريد izzkaled@gmail.com (أو SMS إذا Twilio مفعّل)'
          : 'Code sent to izzkaled@gmail.com (or SMS if Twilio is configured)',
      )
      setPhone(normalized)
      setStep('otp')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    const normalized = normalizePhone(phone.trim())
    if (!normalized) {
      toast.error(t('رقم جوال عُماني غير صالح', 'Invalid Omani phone number'))
      return
    }
    if (!code.trim()) {
      toast.error(t('أدخل رمز التحقق', 'Enter verification code'))
      return
    }
    if (mode === 'signup' && !name.trim()) {
      toast.error(t('أدخل الاسم', 'Enter your name'))
      return
    }

    setLoading(true)
    try {
      const { data, error } = await authClient.phoneNumber.verify({
        phoneNumber: normalized,
        code: code.trim(),
      })
      if (error) throw new Error(error.message || 'Verification failed')

      if (mode === 'signup' && name.trim()) {
        await authClient.updateUser({ name: name.trim() })
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() }),
        })
      }

      if (adminOnly) {
        const access = await fetch('/api/admin/check')
        if (!access.ok) {
          await authClient.signOut()
          throw new Error(t('هذا الرقم غير مصرح له بالدخول', 'This phone is not authorized for admin'))
        }
      }

      toast.success(t('تم تسجيل الدخول', 'Logged in'))
      router.push(redirectTo)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const defaultTitle =
    mode === 'signup'
      ? t('إنشاء حساب', 'Create account')
      : adminOnly
        ? t('تسجيل دخول لوحة الإدارة', 'Admin login')
        : t('تسجيل الدخول', 'Login')

  const defaultDescription =
    mode === 'signup'
      ? t('سجّل برقم جوالك العُماني', 'Sign up with your Omani mobile number')
      : t('أدخل رقم جوالك لاستلام رمز التحقق', 'Enter your phone to receive a verification code')

  return (
    <div dir={dir} className="mx-auto flex w-full max-w-lg items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title || defaultTitle}</CardTitle>
          <CardDescription>{description || defaultDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'phone' && (
            <>
              <div className="space-y-1">
                <Label>{t('رقم الجوال', 'Phone number')}</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('مثال: 9XXXXXXX', 'e.g. 9XXXXXXX')}
                  inputMode="tel"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendOtp()
                  }}
                />
              </div>
              {mode === 'signup' && (
                <div className="space-y-1">
                  <Label>{t('الاسم الكامل', 'Full name')}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}
              <Button className="w-full" onClick={sendOtp} disabled={loading}>
                {loading ? t('جارٍ الإرسال...', 'Sending...') : t('إرسال الرمز', 'Send code')}
              </Button>
              {!adminOnly && (
                <p className="text-center text-sm text-muted-foreground">
                  {mode === 'login' ? (
                    <>
                      {t('ليس لديك حساب؟', "Don't have an account?")}{' '}
                      <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
                        {t('سجّل الآن', 'Sign up')}
                      </Link>
                    </>
                  ) : (
                    <>
                      {t('لديك حساب؟', 'Already have an account?')}{' '}
                      <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                        {t('سجّل الدخول', 'Log in')}
                      </Link>
                    </>
                  )}
                </p>
              )}
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="text-sm text-muted-foreground">
                {t('تم الإرسال إلى', 'Sent to')} {phone}
              </p>
              <div className="space-y-1">
                <Label>{t('رمز التحقق', 'Verification code')}</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') verifyOtp()
                  }}
                />
              </div>
              <Button className="w-full" onClick={verifyOtp} disabled={loading}>
                {loading ? t('جارٍ التحقق...', 'Verifying...') : t('تحقق', 'Verify')}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep('phone')} disabled={loading}>
                {t('تغيير الرقم', 'Change number')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
