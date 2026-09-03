import { NextRequest, NextResponse } from 'next/server'

import { parseLeadSnapshot } from '@/lib/assessment-lead-labels'
import { appendVerifiedAssessmentLead } from '@/lib/assessment-leads-sheet'
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

async function alreadyAppendedToSheet(email: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('assessment_otp_challenges')
    .select('id')
    .eq('email', email)
    .not('sheet_appended_at', 'is', null)
    .limit(1)
  if (error) {
    if (error.code === '42703') return false
    console.error('[assessment/verify-otp] sheet dupe check', error)
    return false
  }
  return Array.isArray(data) && data.length > 0
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
    .select('id, code_hash, expires_at, verified_at, name, email, phone, age, lead_snapshot')
    .eq('session_id', sessionId)
    .eq('channel', 'email')
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr) {
    console.error('[assessment/verify-otp] fetch', fetchErr)
    if (fetchErr.code === '42P01') {
      return NextResponse.json(
        {
          error: 'Verification storage is not ready. Apply the assessment OTP Supabase migrations.',
          code: 'OTP_TABLE_MISSING',
        },
        { status: 503 },
      )
    }
    if (fetchErr.code === '42703') {
      const fallback = await supabaseAdmin
        .from('assessment_otp_challenges')
        .select('id, code_hash, expires_at, verified_at, name, email, phone, age')
        .eq('session_id', sessionId)
        .is('verified_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (fallback.error || !fallback.data) {
        return NextResponse.json({ error: 'No active code found. Request a new one.' }, { status: 400 })
      }
      return finalizeVerify(fallback.data, code, null)
    }
    return NextResponse.json({ error: 'Could not verify. Try again.' }, { status: 500 })
  }

  if (!challenge) {
    return NextResponse.json({ error: 'No active code found. Request a new one.' }, { status: 400 })
  }

  return finalizeVerify(challenge, code, parseLeadSnapshot(challenge.lead_snapshot))
}

async function finalizeVerify(
  challenge: {
    id: string
    code_hash: string
    expires_at: string
    name: string | null
    email: string | null
    phone: string | null
    age: string | null
    lead_snapshot?: unknown
  },
  code: string,
  snapshot: ReturnType<typeof parseLeadSnapshot> | null,
): Promise<NextResponse> {
  if (new Date(String(challenge.expires_at)).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })
  }

  if (challenge.code_hash !== hashOtpCode(code)) {
    return NextResponse.json({ error: 'Incorrect code. Try again.' }, { status: 400 })
  }

  const verifiedAt = new Date().toISOString()
  await supabaseAdmin
    .from('assessment_otp_challenges')
    .update({ verified_at: verifiedAt })
    .eq('id', challenge.id)

  const email = typeof challenge.email === 'string' ? challenge.email.trim().toLowerCase() : ''
  const leadSnapshot = snapshot ?? parseLeadSnapshot(challenge.lead_snapshot)

  if (email) {
    const already = await alreadyAppendedToSheet(email)
    if (!already) {
      const appended = await appendVerifiedAssessmentLead({
        name: challenge.name ?? '',
        email,
        phone: challenge.phone ?? '',
        age: challenge.age ?? '',
        snapshot: leadSnapshot,
      })
      if (appended) {
        await supabaseAdmin
          .from('assessment_otp_challenges')
          .update({ sheet_appended_at: verifiedAt })
          .eq('id', challenge.id)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    verified: true,
    name: challenge.name,
    email: challenge.email,
    phone: challenge.phone,
    age: challenge.age,
  })
}
