import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AdminAppShell } from '@/components/admin/admin-app-shell'
import { getSessionUser } from '@/lib/auth/get-session-user'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') {
    redirect('/admin/login')
  }

  return <AdminAppShell>{children}</AdminAppShell>
}
