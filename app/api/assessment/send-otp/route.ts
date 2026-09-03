import { NextRequest, NextResponse } from 'next/server'

import { isValidLeadBodyMetrics, parseLeadSnapshot } from '@/lib/assessment-lead-labels'
import { isMissingColumn, isMissingRelation, OTP_STORAGE_NOT_READY } from '@/lib/assessment-otp-db'
import {
  deliverOtp,
  generateOtpCode,
  hashOtpCode,
  normalizeIndianPhone,
  otpExpiresAt,
} from '@/lib/checkout-otp-service'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const rateMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(`ip:${ip}`, 6, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim().slice(0, 80) : ''
  if (!sessionId || sessionId.length < 8) {
    return NextResponse.json({ error: 'Missing assessment session.' }, { status: 400 })
  }

  if (!checkRateLimit(`sid:${sessionId}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many codes sent. Wait and try again.' }, { status: 429 })
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : ''
  const age = typeof body.age === 'string' ? body.age.trim().slice(0, 4) : String(body.age ?? '').slice(0, 4)
  const phoneRaw = typeof body.phone === 'string' ? body.phone : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const leadSnapshot = parseLeadSnapshot(body.leadSnapshot)

  if (!name) return NextResponse.json({ error: 'Please enter your first name.' }, { status: 400 })
  const ageNum = Number(age)
  if (!age || !Number.isFinite(ageNum) || ageNum < 10 || ageNum > 120) {
    return NextResponse.json({ error: 'Please enter a valid age.' }, { status: 400 })
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email to receive the code.' }, { status: 400 })
  }
  if (!isValidLeadBodyMetrics(leadSnapshot)) {
    return NextResponse.json(
      { error: 'Please enter gender, height (cm), and weight (kg).' },
      { status: 400 },
    )
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error('[assessment/send-otp] missing Supabase admin env')
    return NextResponse.json(OTP_STORAGE_NOT_READY, { status: 503 })
  }

  const code = generateOtpCode()
  const phoneE164 = normalizeIndianPhone(phoneRaw)

  const row: Record<string, unknown> = {
    session_id: sessionId,
    channel: 'email',
    destination: email,
    code_hash: hashOtpCode(code),
    name,
    email,
    phone: phoneE164 ?? (phoneRaw.trim() || null),
    age,
    lead_snapshot: leadSnapshot,
    expires_at: otpExpiresAt(),
  }

  let { error: insErr } = await supabaseAdmin.from('assessment_otp_challenges').insert(row)

  if (insErr && isMissingColumn(insErr)) {
    delete row.lead_snapshot
    const retry = await supabaseAdmin.from('assessment_otp_challenges').insert(row)
    insErr = retry.error
  }

  if (insErr) {
    console.error('[assessment/send-otp] insert', insErr.code, insErr.message, insErr.details)
    if (isMissingRelation(insErr) || isMissingColumn(insErr)) {
      return NextResponse.json(OTP_STORAGE_NOT_READY, { status: 503 })
    }
    return NextResponse.json(
      { error: 'Could not start verification. Try again.', code: insErr.code ?? 'OTP_INSERT_FAILED' },
      { status: 500 },
    )
  }

  const delivered = await deliverOtp({
    channel: 'email',
    email,
    code,
    purpose: 'assessment',
  })

  if (!delivered.ok) {
    return NextResponse.json({ error: delivered.error, code: 'OTP_DELIVERY_FAILED' }, { status: 503 })
  }

  return NextResponse.json({
    ok: true,
    channel: 'email' as const,
    destinationMasked: email.replace(/(.{2}).+(@.+)/, '$1••••$2'),
  })
}
