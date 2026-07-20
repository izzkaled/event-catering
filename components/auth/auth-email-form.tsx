'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Lock, Mail, ShieldCheck, Sparkles, User } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { authClient } from '@/lib/auth-client'
import {
  getAuthEmail,
  getAuthName,
  getReturnTo,
  saveAuthEmail,
  saveAuthMode,
  saveAuthName,
  saveReturnTo,
} from '@/lib/auth/session-storage'

type AuthEmailFormProps = {
  mode?: 'login' | 'signup'
  adminOnly?: boolean
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

export function AuthEmailForm({ mode = 'login', adminOnly = false }: AuthEmailFormProps) {
  const router = useRouter()
  const { dir, lang } = useLanguage()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  React.useEffect(() => {
    const storedEmail = getAuthEmail()
    const storedName = getAuthName()
    if (storedEmail) setEmail(storedEmail)
    if (storedName && mode === 'signup') setName(storedName)
  }, [mode])

  const finishLoggedIn = async () => {
    await fetch('/api/profile', { credentials: 'include' }).catch(() => null)
    const destination = adminOnly ? '/admin' : getReturnTo('/profile')
    window.location.href = destination
  }

  const goVerify = (targetEmail: string, nextMode: 'login' | 'signup') => {
    saveAuthEmail(targetEmail)
    saveAuthMode(nextMode)
    if (name.trim()) saveAuthName(name.trim())
    router.push(adminOnly ? '/auth/verify?admin=1' : '/auth/verify')
  }

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      toast.error(t('أدخل بريداً إلكترونياً صالحاً', 'Enter a valid email address'))
      return
    }
    if (password.length < 8) {
      toast.error(t('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'Password must be at least 8 characters'))
      return
    }
    if (mode === 'signup' && !name.trim()) {
      toast.error(t('الاسم مطلوب', 'Name is required'))
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await authClient.signUp.email({
          email: normalizedEmail,
          password,
          name: name.trim(),
        })
        if (error) throw new Error(authErrorMessage(error, lang))

        if (data?.user && !data.user.emailVerified) {
          const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
            email: normalizedEmail,
            type: 'email-verification',
          })
          if (otpError) {
            throw new Error(authErrorMessage(otpError, lang))
          }
          toast.success(t('تحقق من بريدك لإدخال رمز OTP', 'Check your email for the OTP code'))
          goVerify(normalizedEmail, 'signup')
          return
        }

        toast.success(t('تم إنشاء الحساب', 'Account created'))
        await finishLoggedIn()
        return
      }

      const { data, error } = await authClient.signIn.email({
        email: normalizedEmail,
        password,
      })

      if (error) {
        const message = authErrorMessage(error, lang)
        const messageLower = message.toLowerCase()
        const code =
          typeof error === 'object' && error !== null && 'code' in error
            ? String((error as { code?: unknown }).code || '')
            : ''

        if (code === 'TOO_MANY_ATTEMPTS' || messageLower.includes('too many failed')) {
          throw new Error(message)
        }

        if (messageLower.includes('verif') || messageLower.includes('email not verified')) {
          const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
            email: normalizedEmail,
            type: 'email-verification',
          })
          if (otpError) {
            throw new Error(authErrorMessage(otpError, lang))
          }
          toast.message(t('يلزم التحقق من البريد أولاً', 'Please verify your email first'))
          goVerify(normalizedEmail, 'login')
          return
        }

        if (
          messageLower.includes('not found') ||
          messageLower.includes('no user') ||
          messageLower.includes('user not found') ||
          messageLower.includes('does not exist') ||
          messageLower.includes('invalid') ||
          messageLower.includes('credential') ||
          messageLower.includes('password')
        ) {
          saveAuthEmail(normalizedEmail)
          saveAuthMode('signup')
          toast.error(
            t(
              'تعذر تسجيل الدخول. إذا لم يكن لديك حساب، سجّل الآن.',
              'Could not sign in. If you don’t have an account, sign up.',
            ),
            {
              action: {
                label: t('إنشاء حساب', 'Sign up'),
                onClick: () => router.push('/auth/signup'),
              },
            },
          )
          return
        }

        throw new Error(message)
      }

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

      if (data?.user && !data.user.emailVerified) {
        const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
          email: normalizedEmail,
          type: 'email-verification',
        })
        if (otpError) {
          throw new Error(authErrorMessage(otpError, lang))
        }
        goVerify(normalizedEmail, 'login')
        return
      }

      toast.success(t('تم تسجيل الدخول بنجاح', 'Logged in successfully'))
      await finishLoggedIn()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('فشل تسجيل الدخول', 'Sign-in failed'))
    } finally {
      setLoading(false)
    }
  }

  const signupBenefits = [
    t('تتبع اشتراكاتك من مكان واحد', 'Track all subscriptions in one place'),
    t('حفظ بياناتك للحجز السريع', 'Save details for faster booking'),
    t('استلام الفواتير على بريدك', 'Receive invoices by email'),
    t('تسجيل دخول آمن عبر Google أو البريد', 'Secure login with Google or email'),
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
            ? t('سجّل الدخول بالبريد وكلمة المرور', 'Sign in with email and password')
            : mode === 'signup'
              ? t('انضم إلينا وابدأ بحجز خدمة التنظيف', 'Join us and start booking cleaning services')
              : t('مرحباً بعودتك! سجّل دخولك للمتابعة', 'Welcome back! Sign in to continue')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!adminOnly && (
          <>
            <GoogleSignInButton />
            <div className="relative py-1 text-center text-xs text-muted-foreground">
              <span className="relative z-10 bg-card px-3">{t('أو بالبريد الإلكتروني', 'or with email')}</span>
              <span className="absolute inset-x-0 top-1/2 border-t border-border" />
            </div>
          </>
        )}

        {mode === 'signup' && (
          <div className="space-y-1.5">
            <Label htmlFor="auth-name">{t('الاسم الكامل', 'Full name')}</Label>
            <div className="relative">
              <FieldIcon>
                <User className="size-4" />
              </FieldIcon>
              <Input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={loading}
                className="h-11 ps-10 text-base"
                placeholder={t('مثال: أحمد الهنائي', 'e.g. Ahmed Al-Hinai')}
              />
            </div>
          </div>
        )}

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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="auth-password">{t('كلمة المرور', 'Password')}</Label>
            {mode === 'login' && (
              <Link
                href="/auth/forgot"
                className="text-xs font-semibold text-brand-terracotta underline-offset-4 hover:underline"
              >
                {t('نسيت كلمة المرور؟', 'Forgot password?')}
              </Link>
            )}
          </div>
          <div className="relative">
            <FieldIcon>
              <Lock className="size-4" />
            </FieldIcon>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              disabled={loading}
              className="h-11 ps-10 text-base"
              placeholder={mode === 'signup' ? t('8 أحرف على الأقل', 'At least 8 characters') : '••••••••'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>
          {mode === 'signup' && (
            <p className="text-xs text-muted-foreground">
              {t('استخدم 8 أحرف أو أكثر لحماية حسابك', 'Use 8+ characters to secure your account')}
            </p>
          )}
        </div>

        <Button className="h-11 w-full text-base shadow-md shadow-primary/15" onClick={submit} disabled={loading}>
          {loading
            ? t('جارٍ...', 'Please wait...')
            : mode === 'signup'
              ? t('إنشاء الحساب', 'Create account')
              : t('تسجيل الدخول', 'Log in')}
        </Button>

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
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => router.push(getReturnTo('/'))}>
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
                  'احفظ بياناتك، تابع اشتراكاتك، واستلم تأكيدات الحجز والفواتير مباشرة.',
                  'Save your details, track subscriptions, and get booking confirmations and invoices.',
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
    <div dir={dir} className="site-container-compact py-10">
      {formCard}
    </div>
  )
}

export function useAuthRedirectSetup() {
  React.useEffect(() => {
    saveReturnTo()
  }, [])
}
