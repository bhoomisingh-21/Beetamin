import { NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/admin-api-auth'
import {
  createNutritionist,
  listAdminNutritionists,
  updateNutritionist,
} from '@/lib/nutritionist-admin'

export const runtime = 'nodejs'

export async function GET() {
  const admin = await requireAdminApi()
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status })

  try {
    const rows = await listAdminNutritionists()
    return NextResponse.json({ rows })
  } catch (e) {
    console.error('[api/admin/nutritionists] list', e)
    return NextResponse.json({ error: 'Could not load nutritionists.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const admin = await requireAdminApi()
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status })

  let body: { name?: string; email?: string; bio?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = await createNutritionist({
    name: String(body.name ?? ''),
    email: String(body.email ?? ''),
    bio: typeof body.bio === 'string' ? body.bio : null,
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true, id: result.id })
}

export async function PATCH(req: Request) {
  const admin = await requireAdminApi()
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status })

  let body: { id?: string; name?: string; email?: string; bio?: string | null; is_active?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body.id) return NextResponse.json({ error: 'Nutritionist id is required.' }, { status: 400 })

  const result = await updateNutritionist({
    id: String(body.id),
    name: typeof body.name === 'string' ? body.name : undefined,
    email: typeof body.email === 'string' ? body.email : undefined,
    bio: body.bio !== undefined ? body.bio : undefined,
    is_active: typeof body.is_active === 'boolean' ? body.is_active : undefined,
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
