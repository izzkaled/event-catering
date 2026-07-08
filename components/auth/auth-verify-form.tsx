'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import {
  clearAuthSessionKeys,
  clearReturnTo,
  getAuthEmail,
  getReturnTo,
} from '@/lib/auth/session-storage'

const RESEND_COOLDOWN_SEC = 30

function authErrorMessage(error: unknown): string {
  if (!error) return 'Verification failed'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return 'Verification failed'
}

export function AuthVerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adminOnly = searchParams.get('admin') === '1'
  const { dir, lang } = useLanguage()
  const [email, setEmail] = React.useState<string | null>(null)
  const [code, setCode] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(RESEND_COOLDOWN_SEC)

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  React.useEffect(() => {
    const stored = getAuthEmail()
    if (!stored) {
      router.replace(adminOnly ? '/admin/login' : '/auth/login')
      return
    }
    setEmail(stored)
  }, [adminOnly, router])

  React.useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const sendOtp = async (showToast = true) => {
    if (!email) return
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'email-verification',
    })
    if (error) throw new Error(authErrorMessage(error))

    if (showToast) {
      toast.success(t('تم إرسال الرمز إلى بريدك', 'Code sent to your email'))
    }
    setCooldown(RESEND_COOLDOWN_SEC)
  }

  const resend = async () => {
    if (!email || cooldown > 0) return
    setLoading(true)
    try {
      await sendOtp(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to resend')
    } finally {
      setLoading(false)
    }
  }

  const verify = async () => {
    if (!email) return
    if (code.trim().length < 4) {
      toast.error(t('أدخل رمز التحقق المرسل إلى بريدك', 'Enter the verification code from your email'))
      return
    }

    setLoading(true)
    try {
      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: code.trim(),
      })
      if (error) throw new Error(authErrorMessage(error))

      // Ensure profile row exists in Neon DB
      await fetch('/api/profile', { credentials: 'include' }).catch(() => null)

      if (adminOnly) {
        const profileRes = await fetch('/api/profile', { credentials: 'include' })
        const profileData = (await profileRes.json().catch(() => null)) as {
          user?: { role?: string }
        } | null
        if (!profileRes.ok || profileData?.user?.role !== 'admin') {
          await authClient.signOut().catch(() => null)
          throw new Error(t('هذا الحساب غير مصرح له بالدخول', 'This account is not authorized for admin'))
        }
      }

      const destination = adminOnly ? '/admin' : getReturnTo('/profile')
      clearAuthSessionKeys()
      clearReturnTo()
      toast.success(t('تم التحقق وتسجيل الدخول', 'Verified and signed in'))
      window.location.href = destination
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (!email) return null

  return (
    <div dir={dir} className="mx-auto w-full max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{t('رمز التحقق', 'Verification code')}</CardTitle>
          <CardDescription>
            {t('أدخل الرمز المرسل إلى', 'Enter the code sent to')}{' '}
            <span className="font-medium text-foreground" dir="ltr">
              {email}
            </span>
            <br />
            <span className="text-xs">
              {t(
                'تحقق من Spam أيضاً — المرسل غالباً auth@mail.myneon.app أو Resend',
                'Also check Spam — sender is usually auth@mail.myneon.app or Resend',
              )}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>{t('رمز OTP من البريد', 'Email OTP code')}</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, '').slice(0, 8))}
              placeholder="••••••"
              inputMode="numeric"
              autoFocus
              className="text-center text-2xl tracking-[0.5em]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') verify()
              }}
            />
          </div>

          <Button className="w-full" onClick={verify} disabled={loading || code.trim().length < 4}>
            {loading ? t('جارٍ التحقق...', 'Verifying...') : t('تأكيد', 'Confirm')}
          </Button>

          <Button variant="outline" className="w-full" onClick={resend} disabled={loading || cooldown > 0}>
            {cooldown > 0
              ? t(`إعادة الإرسال بعد ${cooldown}ث`, `Resend in ${cooldown}s`)
              : t('إعادة إرسال الرمز', 'Resend code')}
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push(adminOnly ? '/admin/login' : '/auth/login')}
            disabled={loading}
          >
            {t('تغيير البريد الإلكتروني', 'Change email')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
