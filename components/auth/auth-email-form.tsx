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

function authErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return 'Something went wrong'
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
        if (error) throw new Error(authErrorMessage(error))

        if (data?.user && !data.user.emailVerified) {
          // Ensure an OTP is requested even if Neon signup email was swallowed by webhook.
          await authClient.emailOtp
            .sendVerificationOtp({ email: normalizedEmail, type: 'email-verification' })
            .catch(() => null)
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
        const message = authErrorMessage(error).toLowerCase()

        // Email exists but not verified yet
        if (message.includes('verif') || message.includes('email not verified')) {
          await authClient.emailOtp
            .sendVerificationOtp({ email: normalizedEmail, type: 'email-verification' })
            .catch(() => null)
          toast.message(t('يلزم التحقق من البريد أولاً', 'Please verify your email first'))
          goVerify(normalizedEmail, 'login')
          return
        }

        // Neon often returns a generic credentials error for unknown emails too.
        if (
          message.includes('not found') ||
          message.includes('no user') ||
          message.includes('user not found') ||
          message.includes('does not exist') ||
          message.includes('invalid') ||
          message.includes('credential') ||
          message.includes('password')
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

        throw new Error(authErrorMessage(error))
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
        await authClient.emailOtp
          .sendVerificationOtp({ email: normalizedEmail, type: 'email-verification' })
          .catch(() => null)
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

  return (
    <div dir={dir} className="mx-auto w-full max-w-lg px-4 py-10">
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
              ? t('سجّل الدخول بالبريد وكلمة المرور', 'Sign in with email and password')
              : mode === 'signup'
                ? t('أنشئ حسابك عبر Google أو البريد الإلكتروني', 'Create account with Google or email')
                : t('سجّل الدخول عبر Google أو البريد الإلكتروني', 'Sign in with Google or email')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!adminOnly && (
            <>
              <GoogleSignInButton />
              <div className="relative py-1 text-center text-xs text-muted-foreground">
                <span className="bg-card relative z-10 px-3">
                  {t('أو بالبريد الإلكتروني', 'or with email')}
                </span>
                <span className="absolute inset-x-0 top-1/2 border-t border-border" />
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="space-y-1">
              <Label>{t('الاسم الكامل', 'Full name')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label>{t('البريد الإلكتروني', 'Email')}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>

          <div className="space-y-1">
            <Label>{t('كلمة المرور', 'Password')}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>

          <Button className="w-full" onClick={submit} disabled={loading}>
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
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t('سجّل الآن', 'Sign up')}
                  </Link>
                </>
              ) : (
                <>
                  {t('لديك حساب؟', 'Already have an account?')}{' '}
                  <Link
                    href="/auth/login"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
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
