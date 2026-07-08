'use client'

import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AuthEmailForm } from '@/components/auth/auth-email-form'

export default function AuthSignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center">
        <Suspense>
          <AuthEmailForm mode="signup" />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
