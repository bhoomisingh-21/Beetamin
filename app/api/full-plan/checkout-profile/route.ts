import { NextResponse } from 'next/server'

import {
  assertAuthenticatedUser,
  parseFullPlanCheckoutProfile,
  saveFullPlanCheckoutProfile,
} from '@/lib/full-plan-checkout-profile'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const authResult = await assertAuthenticatedUser()
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const profile = parseFullPlanCheckoutProfile(body)
  if (!profile) {
    return NextResponse.json({ error: 'Please fill all required fields correctly.' }, { status: 400 })
  }

  const saved = await saveFullPlanCheckoutProfile(authResult.userId, profile)
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
