import { NextResponse } from 'next/server'

import { requireAdminApi } from '@/lib/admin-api-auth'
import {
  grantGiftAccessByEmail,
  listGiftedClients,
  revokeGiftAccess,
  type GiftedPlan,
} from '@/lib/gifted-access'

export const runtime = 'nodejs'

const PLANS = new Set<GiftedPlan>(['report', 'full_plan'])

export async function GET() {
  const admin = await requireAdminApi()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  const rows = await listGiftedClients()
  return NextResponse.json({ rows })
}

export async function POST(req: Request) {
  const admin = await requireAdminApi()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  let body: { email?: string; plan?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const plan = body.plan as GiftedPlan
  const note = typeof body.note === 'string' ? body.note : undefined

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }
  if (!PLANS.has(plan)) {
    return NextResponse.json({ error: 'Plan must be report or full_plan.' }, { status: 400 })
  }

  const result = await grantGiftAccessByEmail({ email, plan, note })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  const planLabel = plan === 'full_plan' ? '₹3,999 Full Plan' : '₹39 Report'
  const message = result.pending
    ? `No account yet for ${result.email} — access reserved for ${planLabel}. It unlocks automatically the moment they sign up.`
    : `Access granted to ${result.email} for ${planLabel}`
  return NextResponse.json({
    success: true,
    message,
    email: result.email,
    plan: result.plan,
    pending: result.pending,
  })
}

export async function DELETE(req: Request) {
  const admin = await requireAdminApi()
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status })
  }

  let body: { userId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
  if (!userId) {
    return NextResponse.json({ error: 'userId (client id) is required.' }, { status: 400 })
  }

  const result = await revokeGiftAccess(userId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Could not revoke.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
