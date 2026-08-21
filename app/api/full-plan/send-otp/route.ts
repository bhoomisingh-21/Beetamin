import { NextResponse } from 'next/server'

import {
  deliverOtp,
  generateOtpCode,
  hashOtpCode,
  normalizeIndianPhone,
  otpExpiresAt,
} from '@/lib/checkout-otp-service'
import {
  assertAuthenticatedUser,
  parseFullPlanCheckoutProfile,
  saveFullPlanCheckoutProfile,
} from '@/lib/full-plan-checkout-profile'
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

  const o = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  const channel = o?.channel === 'email' ? 'email' : o?.channel === 'phone' ? 'phone' : null
  if (!channel) {
    return NextResponse.json({ error: 'channel must be phone or email.' }, { status: 400 })
  }

  const profile = parseFullPlanCheckoutProfile(body)
  if (!profile) {
    return NextResponse.json({ error: 'Please fill all required fields correctly.' }, { status: 400 })
  }

  const saved = await saveFullPlanCheckoutProfile(authResult.userId, profile)
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 500 })
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabaseAdmin
    .from('checkout_otp_challenges')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', authResult.userId)
    .gte('created_at', since)

  if (count && count >= 8) {
    return NextResponse.json({ error: 'Too many codes sent. Wait an hour and try again.' }, { status: 429 })
  }

  const code = generateOtpCode()
  const phoneE164 = normalizeIndianPhone(profile.phone)
  const destination = channel === 'phone' ? phoneE164 : profile.email

  if (channel === 'phone' && !phoneE164) {
    return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 })
  }

  const delivered = await deliverOtp({
    channel,
    phoneE164: phoneE164 ?? undefined,
    email: profile.email,
    code,
  })

  if (!delivered.ok) {
    return NextResponse.json({ error: delivered.error, code: 'OTP_DELIVERY_FAILED' }, { status: 503 })
  }

  const { error: insErr } = await supabaseAdmin.from('checkout_otp_challenges').insert({
    clerk_user_id: authResult.userId,
    channel,
    destination: destination ?? profile.email,
    code_hash: hashOtpCode(code),
    expires_at: otpExpiresAt(),
  })

  if (insErr) {
    console.error('[full-plan/send-otp] insert', insErr)
    return NextResponse.json(
      {
        error: 'Verification storage is not ready. Run the latest Supabase migration.',
        code: 'OTP_TABLE_MISSING',
      },
      { status: 503 },
    )
  }

  return NextResponse.json({
    ok: true,
    channel,
    destinationMasked:
      channel === 'phone' && phoneE164
        ? `+91 •••••${phoneE164.slice(-4)}`
        : profile.email.replace(/(.{2}).+(@.+)/, '$1••••$2'),
  })
}
