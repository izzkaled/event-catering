import { auth } from '@/lib/neon-auth'

export async function POST() {
  await auth.signOut()
  return Response.json({ success: true })
}
