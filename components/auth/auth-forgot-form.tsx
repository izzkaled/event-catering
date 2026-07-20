'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, KeyRound, Lock, Mail } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { getAuthEmail, saveAuthEmail } from '@/lib/auth/session-storage'

const RESEND_COOLDOWN_SEC = 30

function authErrorMessage(error: unknown, lang: 'ar' | 'en'): string {
  if (!error) return lang === 'ar' ? 'حدث خطأ' : 'Something went wrong'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) {
    const obj = error as { message?: unknown; messageAr?: unknown }
    if (typeof obj.messageAr === 'string' && lang === 'ar' && obj.messageAr.trim()) {
      return obj.messageAr
    }
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message
  }
  return lang === 'ar' ? 'حدث خطأ' : 'Something went wrong'
}

type Step = 'email' | 'reset'

export function AuthForgotForm() {
  const router = useRouter()
  const { dir, lang } = useLanguage()
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  const [step, setStep] = React.useState<Step>('email')
  const [email, setEmail] = React.useState('')
  const [otp, setOtp] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)

  React.useEffect(() => {
    const stored = getAuthEmail()
    if (stored) setEmail(stored)
  }, [])

  React.useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const sendResetOtp = async (targetEmail: string, showToast = true) => {
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: targetEmail,
      type: 'forget-password',
    })

    if (error) {
      const { error: fallbackError } = await authClient.forgetPassword.emailOtp({
        email: targetEmail,
      })
      if (fallbackError) throw new Error(authErrorMessage(fallbackError, lang))
    }

    setCooldown(RESEND_COOLDOWN_SEC)
    if (showToast) {
      toast.success(t('تم إرسال رمز الاستعادة إلى بريدك', 'Reset code sent to your email'))
    }
  }

  const requestCode = async () => {
    const normalized = email.trim().toLowerCase()
    if (!normalized || !normalized.includes('@')) {
      toast.error(t('أدخل بريداً إلكترونياً صالحاً', 'Enter a valid email address'))
      return
    }

    setLoading(true)
    try {
      await sendResetOtp(normalized, true)
      saveAuthEmail(normalized)
      setEmail(normalized)
      setStep('reset')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('تعذر إرسال الرمز', 'Could not send code'))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (cooldown > 0 || !email) return
    setLoading(true)
    try {
      await sendResetOtp(email, true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('تعذر إعادة الإرسال', 'Could not resend'))
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    const normalized = email.trim().toLowerCase()
    if (otp.trim().length < 4) {
      toast.error(t('أدخل رمز التحقق من البريد', 'Enter the email verification code'))
      return
    }
    if (password.length < 8) {
      toast.error(t('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'Password must be at least 8 characters'))
      return
    }
    if (password !== confirm) {
      toast.error(t('كلمتا المرور غير متطابقتين', 'Passwords do not match'))
      return
    }

    setLoading(true)
    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email: normalized,
        otp: otp.trim(),
        password,
      })
      if (error) throw new Error(authErrorMessage(error, lang))

      toast.success(t('تم تعيين كلمة المرور الجديدة', 'Your new password is set'))
      saveAuthEmail(normalized)
      router.push('/auth/login')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('تعذر إعادة التعيين', 'Could not reset password'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir={dir} className="site-container-compact py-10">
      <Card className="border-border/80 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-extrabold tracking-tight">
            {step === 'email'
              ? t('نسيت كلمة المرور؟', 'Forgot password?')
              : t('تعيين كلمة مرور جديدة', 'Set a new password')}
          </CardTitle>
          <CardDescription className="text-base">
            {step === 'email'
              ? t(
                  'أدخل بريدك وسنرسل رمز استعادة آمن لإعادة تعيين كلمة المرور.',
                  'Enter your email and we’ll send a secure code to reset your password.',
                )
              : t(
                  'أدخل الرمز المرسل إلى بريدك ثم اختر كلمة مرور جديدة.',
                  'Enter the code from your email, then choose a new password.',
                )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'email' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">{t('البريد الإلكتروني', 'Email')}</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail className="size-4" />
                  </span>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    disabled={loading}
                    className="h-11 ps-10 text-base"
                    placeholder="you@example.com"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void requestCode()
                    }}
                  />
                </div>
              </div>

              <Button
                className="h-11 w-full text-base shadow-md shadow-primary/15"
                onClick={() => void requestCode()}
                disabled={loading}
              >
                {loading ? t('جارٍ الإرسال...', 'Sending...') : t('إرسال رمز الاستعادة', 'Send reset code')}
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-brand-sand/30 bg-brand-sand/10 px-3 py-2.5 text-sm text-muted-foreground">
                {t('الرمز أُرسل إلى', 'Code sent to')}{' '}
                <span className="font-semibold text-foreground" dir="ltr">
                  {email}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="forgot-otp">{t('رمز OTP', 'OTP code')}</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <KeyRound className="size-4" />
                  </span>
                  <Input
                    id="forgot-otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\s/g, '').slice(0, 8))}
                    inputMode="numeric"
                    autoFocus
                    disabled={loading}
                    className="h-12 ps-10 text-center text-xl tracking-[0.35em] sm:text-2xl"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="forgot-password">{t('كلمة المرور الجديدة', 'New password')}</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="size-4" />
                  </span>
                  <Input
                    id="forgot-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    className="h-11 ps-10 text-base"
                    placeholder={t('8 أحرف على الأقل', 'At least 8 characters')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="forgot-confirm">{t('تأكيد كلمة المرور', 'Confirm password')}</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="size-4" />
                  </span>
                  <Input
                    id="forgot-confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    className="h-11 ps-10 text-base"
                    placeholder="••••••••"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void resetPassword()
                    }}
                  />
                </div>
              </div>

              <Button
                className="h-11 w-full text-base shadow-md shadow-primary/15"
                onClick={() => void resetPassword()}
                disabled={loading || otp.trim().length < 4}
              >
                {loading ? t('جارٍ الحفظ...', 'Saving...') : t('حفظ كلمة المرور', 'Save password')}
              </Button>

              <Button
                variant="outline"
                className="h-11 w-full text-base"
                onClick={() => void resend()}
                disabled={loading || cooldown > 0}
              >
                {cooldown > 0
                  ? t(`إعادة الإرسال بعد ${cooldown}ث`, `Resend in ${cooldown}s`)
                  : t('إعادة إرسال الرمز', 'Resend code')}
              </Button>

              <Button
                variant="ghost"
                className="h-11 w-full text-base text-muted-foreground"
                onClick={() => {
                  setStep('email')
                  setOtp('')
                  setPassword('')
                  setConfirm('')
                }}
                disabled={loading}
              >
                {t('تغيير البريد', 'Change email')}
              </Button>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t('العودة لتسجيل الدخول', 'Back to login')}
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
