'use client'

import { Suspense } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AuthCompleteProfileForm } from '@/components/auth/auth-complete-profile-form'
import { AuthPageShell } from '@/components/auth/auth-page-shell'

export default function AuthCompleteProfilePage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <AuthPageShell>
          <Suspense>
            <AuthCompleteProfileForm />
          </Suspense>
        </AuthPageShell>
      </main>
      <SiteFooter />
    </div>
  )
}
