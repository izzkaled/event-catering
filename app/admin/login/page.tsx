'use client'

import { AuthEmailForm } from '@/components/auth/auth-email-form'

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg items-center px-4 py-10">
      <AuthEmailForm mode="login" adminOnly />
    </div>
  )
}
