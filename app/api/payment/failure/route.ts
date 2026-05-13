import { NextResponse } from 'next/server'

import { paymentAppBaseUrl } from '@/lib/payment-app-base-url'
import { parsePayUFormData } from '@/lib/payu'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function GET() {
  return new NextResponse(null, { status: 405 })
}

export async function POST(req: Request) {
  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form payload.' }, { status: 400 })
  }

  const p = parsePayUFormData(fd)
  const txnid = String(p.txnid ?? '').trim()
  const udf2 = String(p.udf2 ?? '').trim()
  const udf3 = String(p.udf3 ?? '').trim()
  const udf4 = String(p.udf4 ?? '').trim()
  const udf5 = String(p.udf5 ?? '').trim()
  const mode = ['new', 'retake', 'regenerate', 'upgrade'].includes(udf2) ? udf2 : udf4
  const rowPk = mode === udf4 ? udf3 : udf4
  const aid = mode === udf4 ? udf2 : udf5
  const userId = String(p.udf1 ?? '').trim()
  const base = paymentAppBaseUrl()

  if (mode === 'upgrade') {
    if (txnid && userId) {
      await supabaseAdmin
        .from('purchases')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('txnid', txnid)
        .eq('user_id', userId)
    }
    return NextResponse.redirect(new URL('/sessions?error=payment_failed', base), 303)
  }

  if (rowPk && userId) {
    let q = supabaseAdmin.from('paid_reports').update({ status: 'failed' }).eq('id', rowPk).eq('user_id', userId)
    if (txnid) q = q.eq('txnid', txnid)
    await q
  } else if (txnid && userId) {
    await supabaseAdmin.from('paid_reports').update({ status: 'failed' }).eq('txnid', txnid).eq('user_id', userId)
  }

  const q = txnid ? `txnid=${encodeURIComponent(txnid)}` : ''
  const q2 = aid ? `${q ? '&' : ''}assessmentId=${encodeURIComponent(aid)}` : ''
  return NextResponse.redirect(new URL(`/payment/failure?${q}${q2}`, base), 303)
}
