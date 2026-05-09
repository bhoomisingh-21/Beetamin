import { waitUntil } from '@vercel/functions'
import { NextResponse } from 'next/server'

import { paymentAppBaseUrl } from '@/lib/payment-app-base-url'
import { parsePayUFormData, verifyPayUResponseHash } from '@/lib/payu'
import { runPaidReportGeneration } from '@/lib/run-paid-report-generation'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const maxDuration = 300

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

  const salt = process.env.PAYU_SALT?.trim()
  const keyConfigured = Boolean(process.env.PAYU_KEY?.trim())
  if (!salt || !keyConfigured) {
    return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 503 })
  }

  const p = parsePayUFormData(fd)
  const baseUrl = paymentAppBaseUrl()

  if (!verifyPayUResponseHash(p, salt)) {
    return NextResponse.json({ error: 'Invalid PayU signature.' }, { status: 400 })
  }

  const statusRaw = String(p.status ?? '').toLowerCase()
  const txnid = String(p.txnid ?? '').trim()
  const mihpayid = String(p.mihpayid ?? '').trim()
  const userId = String(p.udf1 ?? '').trim()
  const assessmentId = String(p.udf2 ?? '').trim()
  const rowPk = String(p.udf3 ?? '').trim()

  const failRedirect = (extra?: string) =>
    NextResponse.redirect(
      new URL(`/payment/failure?txnid=${encodeURIComponent(txnid)}${extra ?? ''}`, baseUrl),
      303,
    )

  if (!txnid || !userId || !assessmentId || !rowPk) {
    return failRedirect()
  }

  if (statusRaw !== 'success') {
    await supabaseAdmin
      .from('paid_reports')
      .update({ status: 'failed' })
      .eq('id', rowPk)
      .eq('user_id', userId)
      .eq('txnid', txnid)
    return failRedirect(`&assessmentId=${encodeURIComponent(assessmentId)}`)
  }

  const { data: row, error: rowErr } = await supabaseAdmin
    .from('paid_reports')
    .select('id,user_id,report_id,status,txnid,assessment_id')
    .eq('id', rowPk)
    .eq('user_id', userId)
    .maybeSingle()

  if (rowErr || !row) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  if (String(row.txnid) !== txnid) {
    return NextResponse.json({ error: 'Transaction mismatch.' }, { status: 400 })
  }

  const rowAssessment = row.assessment_id != null ? String(row.assessment_id) : ''
  if (rowAssessment && rowAssessment !== assessmentId) {
    return NextResponse.json({ error: 'Assessment mismatch for this checkout.' }, { status: 400 })
  }

  const reportSlug = String(row.report_id)
  const currentStatus = String(row.status ?? '')

  if (currentStatus === 'ready' || currentStatus === 'generated') {
    return NextResponse.redirect(new URL(`/report/${encodeURIComponent(reportSlug)}`, baseUrl), 303)
  }

  if (currentStatus === 'failed') {
    return failRedirect(`&assessmentId=${encodeURIComponent(assessmentId)}`)
  }

  if (currentStatus !== 'pending' && currentStatus !== 'generating') {
    return NextResponse.redirect(new URL(`/report/${encodeURIComponent(reportSlug)}`, baseUrl), 303)
  }

  if (currentStatus === 'pending') {
    const { error: updErr } = await supabaseAdmin
      .from('paid_reports')
      .update({
        status: 'generating',
        payment_id: mihpayid || null,
      })
      .eq('id', rowPk)
      .eq('user_id', userId)
      .eq('txnid', txnid)
      .eq('status', 'pending')

    if (updErr) {
      console.error('[payment/success] generating update', updErr)
      return NextResponse.json({ error: 'Could not confirm payment.' }, { status: 500 })
    }

    waitUntil(
      runPaidReportGeneration({
        reportId: reportSlug,
        userId,
        detailedAssessmentId: assessmentId,
      }),
    )
  }

  return NextResponse.redirect(new URL(`/report/${encodeURIComponent(reportSlug)}`, baseUrl), 303)
}
