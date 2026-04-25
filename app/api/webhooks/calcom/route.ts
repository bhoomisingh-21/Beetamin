import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { markAppointmentCompleteById } from '@/lib/booking-actions'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

function verifyCalSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const received = signatureHeader.replace(/^sha256=/i, '').trim()
  if (expected.length !== received.length || !/^[0-9a-f]+$/i.test(received)) {
    return expected === received
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'))
  } catch {
    return expected === received
  }
}

function extractBookingUid(body: Record<string, unknown>): string | null {
  const payload = body.payload
  if (payload && typeof payload === 'object' && payload !== null) {
    const uid = (payload as { uid?: unknown }).uid
    if (typeof uid === 'string' && uid.trim()) return uid.trim()
  }
  if (typeof body.uid === 'string' && body.uid.trim()) return body.uid.trim()
  return null
}

export async function POST(req: Request) {
  const raw = await req.text()
  const secret = process.env.CALCOM_WEBHOOK_SECRET
  if (secret) {
    const sig = req.headers.get('x-cal-signature-256') ?? req.headers.get('X-Cal-Signature-256')
    if (!verifyCalSignature(raw, sig, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const trigger = String(body.triggerEvent || '').toUpperCase()
  const uid = extractBookingUid(body)

  if (!uid) {
    return NextResponse.json({ ok: true, skipped: 'no_booking_uid' })
  }

  const { data: row } = await supabaseAdmin
    .from('appointments')
    .select('id, status')
    .eq('external_booking_uid', uid)
    .maybeSingle()

  if (!row?.id) {
    return NextResponse.json({ ok: true, skipped: 'appointment_not_found' })
  }

  if (trigger === 'BOOKING_CREATED') {
    await supabaseAdmin
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', row.id)
      .eq('status', 'pending')
    return NextResponse.json({ ok: true, action: 'confirmed' })
  }

  if (trigger === 'MEETING_ENDED' || trigger === 'BOOKING_COMPLETED') {
    const result = await markAppointmentCompleteById(String(row.id), null)
    if (!result.ok) {
      return NextResponse.json({ ok: true, skipped: result.reason })
    }
    return NextResponse.json({ ok: true, action: 'completed', detail: result })
  }

  return NextResponse.json({ ok: true, ignored: trigger })
}
