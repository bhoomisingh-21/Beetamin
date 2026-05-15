import { NextRequest, NextResponse } from 'next/server'

import { paymentAppBaseUrl } from '@/lib/payment-app-base-url'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

async function parsePayUPost(req: NextRequest): Promise<Record<string, string>> {
  const p: Record<string, string> = {}
  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('application/x-www-form-urlencoded')) {
    const text = await req.text()
    new URLSearchParams(text).forEach((v, k) => {
      p[k.trim().toLowerCase()] = v
    })
  } else {
    const fd = await req.formData()
    fd.forEach((v, k) => {
      if (typeof v === 'string') p[k.trim().toLowerCase()] = v
    })
  }
  return p
}

export async function GET() {
  const base = paymentAppBaseUrl()
  return NextResponse.redirect(`${base}/sessions?error=payment_failed`, { status: 302 })
}

export async function POST(req: NextRequest) {
  const base = paymentAppBaseUrl()

  const p = await parsePayUPost(req)
  console.log('[payment/failure] params', JSON.stringify(p))

  const txnid = (p.txnid ?? '').trim()
  const userId = (p.udf1 ?? '').trim()
  const udf2 = (p.udf2 ?? '').trim()
  const udf3 = (p.udf3 ?? '').trim()
  const udf4 = (p.udf4 ?? '').trim()

  const usesCurrentContract = ['new', 'retake', 'regenerate', 'upgrade', 'booster'].includes(udf2)
  const mode = usesCurrentContract ? udf2 : udf4
  const rowPk = udf3
  const assessmentId = usesCurrentContract ? udf4 : udf2

  try {
    if (mode === 'upgrade') {
      if (txnid && userId) {
        await supabaseAdmin
          .from('purchases')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('txnid', txnid)
          .eq('user_id', userId)
      }
      return NextResponse.redirect(`${base}/sessions?error=payment_failed`, { status: 302 })
    }

    if (rowPk && userId) {
      let q = supabaseAdmin
        .from('paid_reports')
        .update({ status: 'failed' })
        .eq('id', rowPk)
        .eq('user_id', userId)
      if (txnid) q = q.eq('txnid', txnid)
      await q
    } else if (txnid && userId) {
      await supabaseAdmin
        .from('paid_reports')
        .update({ status: 'failed' })
        .eq('txnid', txnid)
        .eq('user_id', userId)
    }
  } catch (err) {
    console.error('[payment/failure] db update error', err)
  }

  const qs = [
    txnid && `txnid=${encodeURIComponent(txnid)}`,
    assessmentId && `assessmentId=${encodeURIComponent(assessmentId)}`,
  ]
    .filter(Boolean)
    .join('&')

  return NextResponse.redirect(`${base}/payment/failure${qs ? `?${qs}` : ''}`, { status: 302 })
}
