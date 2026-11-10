import { Suspense } from 'react'
import { SupplierDetail } from '@/components/admin/supplier-detail'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function AdminSupplierDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SupplierDetail supplierId={id} />
    </Suspense>
  )
}
