import { PackageEditor } from '@/components/admin/package-editor'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function EditPackagePage({ params }: Props) {
  const { id } = await params
  return <PackageEditor packageId={id} />
}
