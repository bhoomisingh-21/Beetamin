import { NextRequest, NextResponse } from 'next/server'

import { normalizeFreeAssessment } from '@/lib/assessment-profile-fields'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const rateMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 8) return false
  entry.count++
  return true
}

/** Save pre-auth free quiz by email so sign-up on any device can restore results. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  let body: { email?: string; assessmentResult?: unknown; assessmentMeta?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
  }
  const normalized = normalizeFreeAssessment(body.assessmentResult)
  if (!normalized) {
    return NextResponse.json({ error: 'Invalid assessment.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('guest_free_assessments').upsert(
    {
      email,
      assessment_result: normalized,
      assessment_meta: body.assessmentMeta ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' },
  )

  if (error) {
    console.error('[guest-free-assessment]', error)
    if (error.code === '42P01') {
      return NextResponse.json({
        ok: true,
        warning: 'guest_free_assessments table missing — run Supabase migration',
      })
    }
    return NextResponse.json({ error: 'Could not save assessment.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
