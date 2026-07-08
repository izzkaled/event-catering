import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/get-session-user'
import { normalizePhone } from '@/lib/auth/phone'
import { isPhoneTakenByOther } from '@/lib/auth/profile-update'
import { auth } from '@/lib/neon-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    user: {
      id: user.id,
      profileId: user.profileId,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
      area: user.area,
      address: user.address,
      source: user.source,
    },
  })
}

export async function PATCH(req: Request) {
  const current = await getSessionUser()
  if (!current) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as {
    name?: string
    email?: string
    phone?: string
    area?: string
    address?: string
  } | null

  const name = body?.name?.trim()
  if (name !== undefined && !name) {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
  }

  let phone = current.phone
  if (body?.phone !== undefined) {
    const raw = body.phone.trim()
    const normalized = raw ? normalizePhone(raw) : null
    if (raw && !normalized) {
      return NextResponse.json({ error: 'Invalid Oman phone number' }, { status: 400 })
    }
    if (normalized && (await isPhoneTakenByOther(normalized, current.profileId))) {
      return NextResponse.json(
        { error: 'This phone number is already linked to another account' },
        { status: 409 },
      )
    }
    phone = normalized
  }

  if (current.source === 'neon' && (name !== undefined || body?.email !== undefined)) {
    try {
      await auth.updateUser({
        ...(name !== undefined ? { name } : {}),
        ...(body?.email !== undefined ? { email: body.email.trim() || undefined } : {}),
      })
    } catch {
      // profile table is source of truth if Neon update fails
    }
  }

  const [updated] = await db
    .update(users)
    .set({
      name: name ?? undefined,
      email: body?.email !== undefined ? body.email.trim() || null : undefined,
      phone: body?.phone !== undefined ? phone : undefined,
      area: body?.area !== undefined ? body.area.trim() || null : undefined,
      address: body?.address !== undefined ? body.address.trim() || null : undefined,
      updated_at: new Date(),
    })
    .where(eq(users.id, current.profileId))
    .returning()

  if (!updated) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({
    user: {
      id: current.id,
      profileId: updated.id,
      phone: updated.phone,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      area: updated.area,
      address: updated.address,
      source: current.source,
    },
  })
}
