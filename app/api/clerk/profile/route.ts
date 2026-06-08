import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

type Body = {
  phone?: string
  phoneCountryCode?: string
  country?: string
  nationality?: string
  profileSource?: 'signup' | 'checkout' | 'settings'
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = (await req.json()) as Body
    const client = await clerkClient()

    const existing = await client.users.getUser(userId)
    const unsafe = { ...(existing.unsafeMetadata as Record<string, unknown>) }

    if (body.phone) unsafe.phone = body.phone
    if (body.phoneCountryCode) unsafe.phoneCountryCode = body.phoneCountryCode
    if (body.country) unsafe.country = body.country
    if (body.nationality) unsafe.nationality = body.nationality
    if (body.profileSource) unsafe.profileSource = body.profileSource
    unsafe.profileUpdatedAt = new Date().toISOString()

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...(existing.publicMetadata as Record<string, unknown>),
        role: 'customer',
      },
      unsafeMetadata: unsafe,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/clerk/profile]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    )
  }
}
