import { NextRequest, NextResponse } from 'next/server'

import { hashOtpCode } from '@/lib/checkout-otp-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const rateMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 12) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim().slice(0, 80) : ''
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!sessionId) return NextResponse.json({ error: 'Missing assessment session.' }, { status: 400 })
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Enter the 6-digit verification code.' }, { status: 400 })
  }

  const { data: challenge, error: fetchErr } = await supabaseAdmin
    .from('assessment_otp_challenges')
    .select('id, code_hash, expires_at, verified_at, name, email, phone, age')
    .eq('session_id', sessionId)
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr) {
    console.error('[assessment/verify-otp] fetch', fetchErr)
    if (fetchErr.code === '42P01') {
      return NextResponse.json({ ok: true, verified: true, skipped: true, code: 'OTP_TABLE_MISSING' })
    }
    return NextResponse.json({ error: 'Could not verify. Try again.' }, { status: 500 })
  }

  if (!challenge) {
    return NextResponse.json({ error: 'No active code found. Request a new one.' }, { status: 400 })
  }

  if (new Date(String(challenge.expires_at)).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
  }

  if (challenge.code_hash !== hashOtpCode(code)) {
    return NextResponse.json({ error: 'Incorrect code. Try again.' }, { status: 400 })
  }

  await supabaseAdmin
    .from('assessment_otp_challenges')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', challenge.id)

  return NextResponse.json({
    ok: true,
    verified: true,
    name: challenge.name,
    email: challenge.email,
    phone: challenge.phone,
    age: challenge.age,
  })
}
