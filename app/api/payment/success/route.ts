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
  const udf2 = String(p.udf2 ?? '').trim()
  const udf3 = String(p.udf3 ?? '').trim()
  const udf4 = String(p.udf4 ?? '').trim()
  const udf5 = String(p.udf5 ?? '').trim()
  const mode = ['new', 'retake', 'regenerate', 'upgrade'].includes(udf2) ? udf2 : udf4
  const assessmentId = mode === udf4 ? udf2 : udf5
  const rowPk = mode === udf4 ? udf3 : udf4

  const failRedirect = (extra?: string) =>
    NextResponse.redirect(
      new URL(`/payment/failure?txnid=${encodeURIComponent(txnid)}${extra ?? ''}`, baseUrl),
      303,
    )

  if (!txnid || !userId || !mode) {
    return failRedirect()
  }

  if (mode === 'upgrade') {
    const sessionsRedirect = () => NextResponse.redirect(new URL('/sessions?error=payment_failed', baseUrl), 303)

    if (statusRaw !== 'success') {
      await supabaseAdmin
        .from('purchases')
        .update({ status: 'failed', payment_id: mihpayid || null, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('txnid', txnid)
      return sessionsRedirect()
    }

    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 3)
    const email = String(p.email ?? '').trim().toLowerCase() || `noemail_${userId.slice(-14)}@beetamin.internal`
    const name = String(p.firstname ?? '').trim() || 'Patient'

    const { error: purchaseErr } = await supabaseAdmin
      .from('purchases')
      .update({
        status: 'active',
        payment_id: mihpayid || null,
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .eq('txnid', txnid)
      .eq('plan', 'full')

    if (purchaseErr) {
      console.error('[payment/success] activate purchase', purchaseErr)
      return NextResponse.json({ error: 'Could not activate purchase.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Could not activate session plan.' }, { status: 500 })
    }

    return NextResponse.redirect(new URL('/booking', baseUrl), 303)
  }

  if (!assessmentId || !rowPk) {
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
