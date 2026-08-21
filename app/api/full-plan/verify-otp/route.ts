import { NextResponse } from 'next/server'

import {
  FULL_PLAN_CHECKOUT_COOKIE,
  FULL_PLAN_CHECKOUT_COOKIE_MAX_AGE_SEC,
  signCheckoutVerification,
} from '@/lib/checkout-verification-cookie'
import { hashOtpCode, normalizeIndianPhone } from '@/lib/checkout-otp-service'
import { assertAuthenticatedUser } from '@/lib/full-plan-checkout-profile'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

  const code = typeof (body as { code?: unknown })?.code === 'string' ? (body as { code: string }).code.trim() : ''
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Enter the 6-digit verification code.' }, { status: 400 })
  }

  const { data: challenge, error: fetchErr } = await supabaseAdmin
    .from('checkout_otp_challenges')
    .select('id, code_hash, expires_at, verified_at, destination, channel')
    .eq('clerk_user_id', authResult.userId)
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr || !challenge) {
    return NextResponse.json({ error: 'No active code found. Request a new one.' }, { status: 400 })
  }

  if (new Date(String(challenge.expires_at)).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
  }

  if (challenge.code_hash !== hashOtpCode(code)) {
    return NextResponse.json({ error: 'Incorrect code. Try again.' }, { status: 400 })
  }

  await supabaseAdmin
    .from('checkout_otp_challenges')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', challenge.id)

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('phone')
    .eq('clerk_user_id', authResult.userId)
    .maybeSingle()

  const phoneForCookie =
    client?.phone && typeof client.phone === 'string'
      ? normalizeIndianPhone(client.phone) ?? client.phone
      : String(challenge.destination)

  await supabaseAdmin
    .from('clients')
    .update({ phone_verified_at: new Date().toISOString() })
    .eq('clerk_user_id', authResult.userId)

  const secret = process.env.COOKIE_SECRET?.trim()
  const res = NextResponse.json({ ok: true, verified: true })

  if (secret) {
    const token = signCheckoutVerification(
      {
        userId: authResult.userId,
        phone: phoneForCookie,
        exp: Date.now() + FULL_PLAN_CHECKOUT_COOKIE_MAX_AGE_SEC * 1000,
      },
      secret,
    )
    res.cookies.set(FULL_PLAN_CHECKOUT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: FULL_PLAN_CHECKOUT_COOKIE_MAX_AGE_SEC,
    })
  }

  return res
}
