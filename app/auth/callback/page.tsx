'use client'

import * as React from 'react'
import { authClient } from '@/lib/auth-client'
import {
  COMPLETE_PROFILE_PATH,
  isCustomerProfileComplete,
} from '@/lib/auth/profile-completeness'
import { clearReturnTo, getReturnTo } from '@/lib/auth/session-storage'

export default function AuthCallbackPage() {
  const [message, setMessage] = React.useState('Completing sign-in...')

  React.useEffect(() => {
    let cancelled = false

    async function finish() {
      try {
        // Retry briefly while middleware finishes cookie exchange
        let authed = false
        for (let i = 0; i < 5; i++) {
          const session = await authClient.getSession()
          if (session.data?.user) {
            authed = true
            break
          }
          await new Promise((r) => setTimeout(r, 300))
        }

        if (cancelled) return

        if (authed) {
          const profileRes = await fetch('/api/profile', { credentials: 'include' }).catch(() => null)
          const profileData = (await profileRes?.json().catch(() => null)) as {
            user?: { role?: string; name?: string | null; phone?: string | null; area?: string | null }
          } | null
          const destination = getReturnTo('/profile')

          if (destination.startsWith('/admin')) {
            if (profileRes?.ok && profileData?.user?.role === 'admin') {
              clearReturnTo()
              window.location.href = '/admin'
              return
            }
            await authClient.signOut().catch(() => null)
            window.location.href = '/admin/login'
            return
          }

          if (!isCustomerProfileComplete(profileData?.user)) {
            window.location.href = COMPLETE_PROFILE_PATH
            return
          }

          clearReturnTo()
          window.location.href = destination
          return
        }

        setMessage('Sign-in incomplete. Redirecting...')
        window.location.href = '/auth/login'
      } catch {
        if (!cancelled) window.location.href = '/auth/login'
      }
    }

    finish()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
