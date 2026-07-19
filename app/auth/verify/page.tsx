'use client'

import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AuthVerifyForm } from '@/components/auth/auth-verify-form'

export default function AuthVerifyPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex min-w-0 flex-1 items-center justify-center overflow-x-clip px-3">
        <Suspense>
          <AuthVerifyForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
