'use client'

import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AuthVerifyForm } from '@/components/auth/auth-verify-form'

export default function AuthVerifyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center">
        <Suspense>
          <AuthVerifyForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
