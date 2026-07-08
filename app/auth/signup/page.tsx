'use client'

import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AuthEmailForm } from '@/components/auth/auth-email-form'
import { AuthPageShell } from '@/components/auth/auth-page-shell'

export default function AuthSignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <AuthPageShell>
          <Suspense>
            <AuthEmailForm mode="signup" />
          </Suspense>
        </AuthPageShell>
      </main>
      <SiteFooter />
    </div>
  )
}
