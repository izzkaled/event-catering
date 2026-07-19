'use client'

import { AuthEmailForm } from '@/components/auth/auth-email-form'
import { BrandLogo } from '@/components/brand-logo'

export default function AdminLoginPage() {
  return (
    <div className="page-shell site-container-tight flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 py-10">
      <BrandLogo size="lg" subtitle="Admin · Muscat" />
      <AuthEmailForm mode="login" adminOnly />
    </div>
  )
}
