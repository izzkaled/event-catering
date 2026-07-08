'use client'

import * as React from 'react'
import { authClient } from '@/lib/auth-client'
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
          // Ensure profile row is created/synced in Neon DB
          await fetch('/api/profile', { credentials: 'include' }).catch(() => null)
          const destination = getReturnTo('/profile')
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
