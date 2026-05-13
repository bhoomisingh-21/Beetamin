import { waitUntil } from '@vercel/functions'
import { NextRequest, NextResponse } from 'next/server'

import { paymentAppBaseUrl } from '@/lib/payment-app-base-url'
import { verifyPayUResponseHash } from '@/lib/payu'
import { runPaidReportGeneration } from '@/lib/run-paid-report-generation'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const maxDuration = 300

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
  return NextResponse.redirect(`${base}/sessions`, { status: 302 })
}

export async function POST(req: NextRequest) {
  const base = paymentAppBaseUrl()

  const p = await parsePayUPost(req)
  console.log('[payment/success] params', JSON.stringify(p))

  const salt = process.env.PAYU_SALT?.trim()
  if (!salt || !process.env.PAYU_KEY?.trim()) {
    console.error('[payment/success] PayU env vars missing')
    return NextResponse.redirect(`${base}/sessions?error=server_error`, { status: 302 })
  }

  if (!verifyPayUResponseHash(p, salt)) {
    console.error('[payment/success] hash mismatch')
    return NextResponse.redirect(`${base}/sessions?error=invalid`, { status: 302 })
  }

  const statusRaw = (p.status ?? '').toLowerCase()
  const txnid = (p.txnid ?? '').trim()
  const mihpayid = (p.mihpayid ?? '').trim()
  const userId = (p.udf1 ?? '').trim()
  const udf2 = (p.udf2 ?? '').trim()
  const udf3 = (p.udf3 ?? '').trim()
  const udf4 = (p.udf4 ?? '').trim()

  const usesCurrentContract = ['new', 'retake', 'regenerate', 'upgrade'].includes(udf2)
  const mode = usesCurrentContract ? udf2 : udf4
  const rowPk = udf3
  const assessmentId = usesCurrentContract ? udf4 : udf2

  if (!txnid || !userId || !mode) {
    return NextResponse.redirect(`${base}/sessions?error=payment_failed`, { status: 302 })
  }

  try {
    if (mode === 'upgrade') {
      if (statusRaw !== 'success') {
        await supabaseAdmin
          .from('purchases')
          .update({ status: 'failed', payment_id: mihpayid || null, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('txnid', txnid)
        return NextResponse.redirect(`${base}/sessions?error=payment_failed`, { status: 302 })
      }

      if (!rowPk) {
        return NextResponse.redirect(`${base}/sessions?error=payment_failed`, { status: 302 })
      }

      const now = new Date()
      const endDate = new Date(now)
      endDate.setMonth(endDate.getMonth() + 3)
      const email =
        (p.email ?? '').trim().toLowerCase() ||
        `noemail_${userId.slice(-14)}@beetamin.internal`
      const name = (p.firstname ?? '').trim() || 'Patient'

      const { error: purchaseErr } = await supabaseAdmin
        .from('purchases')
        .update({
          status: 'active',
          payment_id: mihpayid || null,
          updated_at: now.toISOString(),
        })
        .eq('id', rowPk)
        .eq('user_id', userId)
        .eq('txnid', txnid)
        .eq('plan', 'full')

      if (purchaseErr) {
        console.error('[payment/success] activate purchase', purchaseErr)
        return NextResponse.redirect(`${base}/sessions?error=server_error`, { status: 302 })
      }

      const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('clerk_user_id', userId)
        .maybeSingle()

      const clientPatch = {
        clerk_user_id: userId,
        name,
        email,
        phone: '',
        plan_start_date: now.toISOString().split('T')[0],
        plan_end_date: endDate.toISOString().split('T')[0],
        status: 'active',
        sessions_total: 6,
        sessions_used: 0,
        sessions_remaining: 6,
      }

      const clientResult = existingClient?.id
        ? await supabaseAdmin
            .from('clients')
            .update({
              plan_start_date: clientPatch.plan_start_date,
              plan_end_date: clientPatch.plan_end_date,
              status: clientPatch.status,
              sessions_total: clientPatch.sessions_total,
              sessions_used: clientPatch.sessions_used,
              sessions_remaining: clientPatch.sessions_remaining,
            })
            .eq('id', existingClient.id)
        : await supabaseAdmin.from('clients').upsert(clientPatch, { onConflict: 'email' })

      if (clientResult.error) {
        console.error('[payment/success] activate client', clientResult.error)
      }

      return NextResponse.redirect(`${base}/booking`, { status: 302 })
    }

    // ── Report modes: new / retake / regenerate ───────────────────────────────
    if (!assessmentId || !rowPk) {
      return NextResponse.redirect(`${base}/sessions?error=payment_failed`, { status: 302 })
    }

    if (statusRaw !== 'success') {
      await supabaseAdmin
        .from('paid_reports')
        .update({ status: 'failed' })
        .eq('id', rowPk)
        .eq('user_id', userId)
        .eq('txnid', txnid)
      return NextResponse.redirect(
        `${base}/payment/failure?txnid=${encodeURIComponent(txnid)}&assessmentId=${encodeURIComponent(assessmentId)}`,
        { status: 302 },
      )
    }

    const { data: row, error: rowErr } = await supabaseAdmin
      .from('paid_reports')
      .select('id,user_id,report_id,status,txnid,assessment_id')
      .eq('id', rowPk)
      .eq('user_id', userId)
      .maybeSingle()

    if (rowErr || !row) {
      console.error('[payment/success] paid_reports row not found', rowErr)
      return NextResponse.redirect(`${base}/sessions?error=server_error`, { status: 302 })
    }

    if (String(row.txnid) !== txnid) {
      console.error('[payment/success] txnid mismatch')
      return NextResponse.redirect(`${base}/sessions?error=invalid`, { status: 302 })
    }

    const rowAssessmentId = row.assessment_id != null ? String(row.assessment_id) : ''
    if (rowAssessmentId && rowAssessmentId !== assessmentId) {
      console.error('[payment/success] assessment mismatch')
      return NextResponse.redirect(`${base}/sessions?error=invalid`, { status: 302 })
    }

    const reportSlug = String(row.report_id)
    const currentStatus = String(row.status ?? '')

    if (currentStatus === 'ready' || currentStatus === 'generated') {
      return NextResponse.redirect(`${base}/report/${encodeURIComponent(reportSlug)}`, { status: 302 })
    }

    if (currentStatus === 'failed') {
      return NextResponse.redirect(
        `${base}/payment/failure?txnid=${encodeURIComponent(txnid)}&assessmentId=${encodeURIComponent(assessmentId)}`,
        { status: 302 },
      )
    }

    if (currentStatus === 'pending') {
      const { error: updErr } = await supabaseAdmin
        .from('paid_reports')
        .update({ status: 'generating', payment_id: mihpayid || null })
        .eq('id', rowPk)
        .eq('user_id', userId)
        .eq('txnid', txnid)
        .eq('status', 'pending')

      if (updErr) {
        console.error('[payment/success] generating update', updErr)
        return NextResponse.redirect(`${base}/sessions?error=server_error`, { status: 302 })
      }

      waitUntil(
        runPaidReportGeneration({
          reportId: reportSlug,
          userId,
          detailedAssessmentId: assessmentId,
        }),
      )
    }

    return NextResponse.redirect(`${base}/report/${encodeURIComponent(reportSlug)}`, { status: 302 })
  } catch (err) {
    console.error('[payment/success] unexpected error', err)
    return NextResponse.redirect(`${base}/sessions?error=server_error`, { status: 302 })
  }
}
