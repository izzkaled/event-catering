'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { authClient } from '@/lib/auth-client'
import {
  getAuthEmail,
  getReturnTo,
  saveAuthEmail,
  saveAuthMode,
  captureRedirectFromSearch,
  markOtpAlreadySent,
} from '@/lib/auth/session-storage'

type AuthEmailFormProps = {
  mode?: 'login' | 'signup'
  adminOnly?: boolean
}

type EmailOtpClient = {
  emailOtp: {
    sendVerificationOtp: (args: {
      email: string
      type: 'sign-in' | 'email-verification' | 'forget-password'
    }) => Promise<{ data: unknown; error: unknown }>
  }
  signIn: {
    emailOtp?: (args: {
      email: string
      otp: string
      name?: string
    }) => Promise<{ data: unknown; error: unknown }>
  }
}

function authErrorMessage(error: unknown, lang: 'ar' | 'en' = 'en'): string {
  if (!error) return lang === 'ar' ? 'حدث خطأ' : 'Something went wrong'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) {
    const obj = error as { message?: unknown; messageAr?: unknown; code?: unknown }
    if (obj.code === 'TOO_MANY_ATTEMPTS' || obj.code === 'TOO_MANY_SIGNUPS') {
      if (lang === 'ar' && typeof obj.messageAr === 'string' && obj.messageAr.trim()) {
        return obj.messageAr
      }
    }
    if (typeof obj.messageAr === 'string' && lang === 'ar' && obj.messageAr.trim()) {
      return obj.messageAr
    }
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message
  }
  return lang === 'ar' ? 'حدث خطأ' : 'Something went wrong'
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      {children}
    </span>
  )
}

/** Send passwordless OTP (prefer sign-in; fall back to email-verification). */
export async function sendEmailSignInOtp(email: string, lang: 'ar' | 'en' = 'en') {
  const client = authClient as unknown as EmailOtpClient
  const signInAttempt = await client.emailOtp.sendVerificationOtp({
    email,
    type: 'sign-in',
  })
  if (!signInAttempt.error) {
    return { type: 'sign-in' as const }
  }

  const verifyAttempt = await client.emailOtp.sendVerificationOtp({
    email,
    type: 'email-verification',
  })
  if (!verifyAttempt.error) {
    return { type: 'email-verification' as const }
  }

  throw new Error(authErrorMessage(signInAttempt.error || verifyAttempt.error, lang))
}

export function AuthEmailForm({ mode = 'login', adminOnly = false }: AuthEmailFormProps) {
  const router = useRouter()
  const { dir, lang } = useLanguage()
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  React.useEffect(() => {
    captureRedirectFromSearch(window.location.search)
    const storedEmail = getAuthEmail()
    if (storedEmail) setEmail(storedEmail)
  }, [])

  const goVerify = (targetEmail: string) => {
    saveAuthEmail(targetEmail)
    saveAuthMode(mode)
    markOtpAlreadySent()
    router.push(adminOnly ? '/auth/verify?admin=1' : '/auth/verify')
  }

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      toast.error(t('أدخل بريداً إلكترونياً صالحاً', 'Enter a valid email address'))
      return
    }

    setLoading(true)
    try {
      await sendEmailSignInOtp(normalizedEmail, lang)
      toast.success(t('تحقق من بريدك لإدخال رمز OTP', 'Check your email for the OTP code'))
      goVerify(normalizedEmail)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('تعذر إرسال الرمز', 'Could not send code'))
    } finally {
      setLoading(false)
    }
  }

  const signupBenefits = [
    t('تتبع طلباتك من مكان واحد', 'Track all your requests in one place'),
    t('حفظ بياناتك لطلب أسرع', 'Save details for faster requests'),
    t('استلام العروض والفواتير على بريدك', 'Receive quotes and invoices by email'),
    t('تسجيل دخول آمن عبر Google أو البريد وOTP', 'Secure login with Google or email OTP'),
  ]

  const formCard = (
    <Card className="border-border/80 shadow-xl shadow-primary/5">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-extrabold tracking-tight">
          {adminOnly
            ? t('تسجيل دخول لوحة الإدارة', 'Admin login')
            : mode === 'signup'
              ? t('إنشاء حساب', 'Create account')
              : t('تسجيل الدخول', 'Login')}
        </CardTitle>
        <CardDescription className="text-base">
          {adminOnly
            ? t('سجّل الدخول بـ Google أو البريد ورمز OTP', 'Sign in with Google or email OTP')
            : mode === 'signup'
              ? t('انضم إلينا عبر Google أو البريد ورمز التحقق', 'Join with Google or email OTP')
              : t('مرحباً بعودتك! سجّل دخولك للمتابعة', 'Welcome back! Sign in to continue')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleSignInButton adminOnly={adminOnly} />
        <div className="relative py-1 text-center text-xs text-muted-foreground">
          <span className="relative z-10 bg-card px-3">{t('أو بالبريد الإلكتروني', 'or with email')}</span>
          <span className="absolute inset-x-0 top-1/2 border-t border-border" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="auth-email">{t('البريد الإلكتروني', 'Email')}</Label>
          <div className="relative">
            <FieldIcon>
              <Mail className="size-4" />
            </FieldIcon>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              disabled={loading}
              className="h-11 ps-10 text-base"
              placeholder="you@example.com"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>
        </div>

        <Button className="h-11 w-full text-base shadow-md shadow-primary/15" onClick={submit} disabled={loading}>
          {loading
            ? t('جارٍ إرسال الرمز...', 'Sending code...')
            : mode === 'signup'
              ? t('إرسال رمز التحقق', 'Send verification code')
              : t('تسجيل الدخول', 'Log in')}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {t('سندخل بحسابك عبر رمز OTP — بدون كلمة مرور', 'Sign in with an email OTP — no password')}
        </p>

        {!adminOnly && (
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                {t('ليس لديك حساب؟', "Don't have an account?")}{' '}
                <Link
                  href="/auth/signup"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {t('سجّل الآن', 'Sign up')}
                </Link>
              </>
            ) : (
              <>
                {t('لديك حساب؟', 'Already have an account?')}{' '}
                <Link
                  href="/auth/login"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {t('سجّل الدخول', 'Log in')}
                </Link>
              </>
            )}
          </p>
        )}

        {!adminOnly && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => router.push(getReturnTo('/'))}
          >
            {t('إلغاء والعودة', 'Cancel and go back')}
          </Button>
        )}
      </CardContent>
    </Card>
  )

  if (mode === 'signup' && !adminOnly) {
    return (
      <div dir={dir} className="site-container-xl grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="hidden border-primary/15 bg-primary/5 lg:flex lg:flex-col lg:justify-center">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" />
                {t('حساب مجاني', 'Free account')}
              </span>
              <h2 className="text-2xl font-extrabold leading-snug">
                {t('لماذا تنشئ حساباً؟', 'Why create an account?')}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(
                  'احفظ بياناتك، تابع طلباتك، واستلم تأكيدات الحجز والفواتير مباشرة.',
                  'Save your details, track requests, and get booking confirmations and invoices.',
                )}
              </p>
            </div>
            <ul className="space-y-3">
              {signupBenefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 p-4 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-primary" />
              {t('بياناتك محمية ولا تُشارك مع أطراف خارجية', 'Your data is protected and never shared with third parties')}
            </div>
          </CardContent>
        </Card>
        {formCard}
      </div>
    )
  }

  return (
    <div dir={dir} className="site-container-compact py-2 sm:py-10">
      {formCard}
    </div>
  )
}

export function useAuthRedirectSetup() {
  React.useEffect(() => {
    captureRedirectFromSearch(window.location.search)
  }, [])
}
