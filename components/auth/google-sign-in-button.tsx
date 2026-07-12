'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { saveReturnTo } from '@/lib/auth/session-storage'

type GoogleSignInButtonProps = {
  callbackURL?: string
  adminOnly?: boolean
}

function isAuthPath(path: string) {
  return (
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/signup') ||
    path.startsWith('/auth/verify') ||
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/admin/login')
  )
}

export function GoogleSignInButton({ callbackURL, adminOnly = false }: GoogleSignInButtonProps) {
  const { lang } = useLanguage()
  const [loading, setLoading] = React.useState(false)
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      // Save where the user should land AFTER OAuth — never the login page itself.
      const current = `${window.location.pathname}${window.location.search}`
      if (!callbackURL && !isAuthPath(current)) {
        saveReturnTo(current)
      } else if (!callbackURL && !sessionStorage.getItem('returnTo')) {
        saveReturnTo('/profile')
      }

      // Always return to this browser origin. Preferring NEXT_PUBLIC_SITE_URL breaks
      // local Google login when Next.js falls back to another port (e.g. 3001).
      // Neon Auth middleware must see /auth/callback (not /auth/login) to exchange
      // the neon_auth_session_verifier cookie.
      const siteUrl = window.location.origin.replace(/\/$/, '')
      const oauthReturn = `${siteUrl}/auth/callback`

      const { data, error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: oauthReturn,
        newUserCallbackURL: oauthReturn,
        errorCallbackURL: adminOnly
          ? `${siteUrl}/admin/login`
          : `${siteUrl}/auth/login`,
      })

      if (error) throw new Error(error.message || 'Google sign-in failed')

      // Some adapters return a redirect URL instead of navigating automatically.
      const redirectUrl =
        data && typeof data === 'object' && 'url' in data
          ? (data as { url?: string }).url
          : undefined

      if (redirectUrl) {
        window.location.href = redirectUrl
        return
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Google sign-in failed')
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2 h-11 text-base"
      onClick={signInWithGoogle}
      disabled={loading}
    >
      <GoogleIcon />
      {loading
        ? t('جارٍ التحويل...', 'Redirecting...')
        : t('المتابعة مع Google', 'Continue with Google')}
    </Button>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l.1.1 6.3 5.3C39.1 37.1 44 32 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  )
}
