'use client'

import * as React from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AuthPageShell } from '@/components/auth/auth-page-shell'

/** Password reset is retired — login is Google or email OTP only. */
export default function AuthForgotPage() {
  const { dir, lang } = useLanguage()
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <AuthPageShell>
          <div dir={dir} className="site-container-compact py-2 sm:py-10">
            <Card className="border-border/80 shadow-xl shadow-primary/5">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-extrabold tracking-tight">
                  {t('الدخول بدون كلمة مرور', 'Passwordless sign-in')}
                </CardTitle>
                <CardDescription className="text-base">
                  {t(
                    'لم نعد نستخدم كلمات المرور. سجّل الدخول بـ Google أو البريد ورمز OTP.',
                    'We no longer use passwords. Sign in with Google or email OTP.',
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button render={<Link href="/auth/login" />} nativeButton={false} className="h-11 w-full text-base">
                  {t('الذهاب لتسجيل الدخول', 'Go to login')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </AuthPageShell>
      </main>
      <SiteFooter />
    </div>
  )
}
