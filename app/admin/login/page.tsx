'use client'

import { Suspense, useEffect } from 'react'
import { AuthEmailForm } from '@/components/auth/auth-email-form'
import { BrandLogo } from '@/components/brand-logo'
import { saveReturnTo } from '@/lib/auth/session-storage'

function AdminLoginInner() {
  useEffect(() => {
    saveReturnTo('/admin')
  }, [])

  return <AuthEmailForm mode="login" adminOnly />
}

export default function AdminLoginPage() {
  return (
    <div className="page-shell site-container-tight flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 py-10">
      <BrandLogo size="lg" subtitle="Admin · Event Catering" />
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        دخول الإدارة مسموح فقط للحسابات المضافة في إعدادات السيرفر (ADMIN_EMAIL / ADMIN_PHONE).
      </p>
      <Suspense>
        <AdminLoginInner />
      </Suspense>
    </div>
  )
}
