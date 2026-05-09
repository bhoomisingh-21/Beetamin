import { auth } from '@clerk/nextjs/server'
import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'

import type { PaymentMode } from '@/lib/payu-types'
import { generatePayUHash, makePayUTxnId, rupeesForPaymentMode } from '@/lib/payu'
import {
  paymentAppBaseUrl,
  payuHostedActionUrl,
  payuMerchantConfigured,
} from '@/lib/payment-app-base-url'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

function makeReportSlug() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const suffix = randomBytes(2).toString('hex').toUpperCase()
  return `BT-${y}${m}${d}-${suffix}`
}

function firstNameFrom(display: string) {
  const t = display.trim().split(/\s+/)[0] || 'Patient'
  return t.slice(0, 55)
}

const MODES = new Set<PaymentMode>(['new', 'retake', 'regenerate'])

export async function GET() {
  return new NextResponse(null, { status: 405 })
}

/** ₹3,999 first Recovery Report checkout (`new`); ₹39 retake/regenerate upsell paths. */
export async function POST(req: Request) {
  if (!payuMerchantConfigured()) {
    return NextResponse.json({ error: 'Payment gateway not configured.', code: 'PAYU_UNAVAILABLE' }, { status: 503 })
  }

  const key = process.env.PAYU_KEY?.trim()
  const salt = process.env.PAYU_SALT?.trim()
  const payuUrl = payuHostedActionUrl()
  if (!key || !salt || !payuUrl) {
    return NextResponse.json({ error: 'Payment gateway not configured.', code: 'PAYU_UNAVAILABLE' }, { status: 503 })
  }

  const sessionUserId = (await auth()).userId ?? null
  if (!sessionUserId) {
    return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 })
  }

  let body: { userId?: string; assessmentId?: string; mode?: PaymentMode; amount?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (typeof body.userId === 'string' && body.userId.trim() !== sessionUserId) {
    return NextResponse.json({ error: 'Identity mismatch.' }, { status: 403 })
  }

  const assessmentId = typeof body.assessmentId === 'string' ? body.assessmentId.trim() : ''
  const mode = body.mode

  if (!assessmentId || !mode || !MODES.has(mode)) {
    return NextResponse.json(
      { error: 'Required: assessmentId and mode ∈ {new, retake, regenerate}.' },
      { status: 400 },
    )
  }

  const rupeesServer = rupeesForPaymentMode(mode)
  if (typeof body.amount === 'number' && Math.round(Number(body.amount)) !== rupeesServer) {
    return NextResponse.json(
      {
        error: `Amount (${body.amount}) does not match pricing for mode "${mode}" — use ${rupeesServer}.`,
        code: 'AMOUNT_MISMATCH',
      },
      { status: 400 },
    )
  }

  const { data: detailed, error: dErr } = await supabaseAdmin
    .from('detailed_assessments')
    .select('id,user_id')
    .eq('id', assessmentId)
    .maybeSingle()

  if (dErr || !detailed || String(detailed.user_id) !== sessionUserId) {
    return NextResponse.json({ error: 'Assessment not found or access denied.' }, { status: 404 })
  }

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('name, email, assessment_result')
    .eq('clerk_user_id', sessionUserId)
    .maybeSingle()

  const freeAssessment = client?.assessment_result
  if (
    !freeAssessment ||
    typeof freeAssessment !== 'object' ||
    Array.isArray(freeAssessment)
  ) {
    return NextResponse.json(
      {
        error:
          'We could not find your free quiz on file. Finish the quiz or open results while signed in, then retry.',
        code: 'MISSING_FREE_ASSESSMENT',
      },
      { status: 400 },
    )
  }

  const emailResolved =
    (typeof client?.email === 'string' ? client.email.trim() : '') ||
    `noemail_${sessionUserId.slice(-14)}@beetamin.internal`
  const displayName = (typeof client?.name === 'string' ? client.name.trim() : '') || 'Patient'
  const firstname = firstNameFrom(displayName)

  const txnid = makePayUTxnId()
  const reportId = makeReportSlug()
  const pdfPath = `${sessionUserId}/${reportId}.pdf`
  const amountFormatted = `${rupeesServer.toFixed(2)}`

  const { data: insertRow, error: insErr } = await supabaseAdmin
    .from('paid_reports')
    .insert({
      user_id: sessionUserId,
      email: emailResolved.toLowerCase(),
      report_id: reportId,
      pdf_url: pdfPath,
      amount: rupeesServer,
      status: 'pending',
      assessment_id: assessmentId,
      payment_id: null,
      txnid,
      free_assessment_snapshot: freeAssessment,
      deficiency_summary: null,
    })
    .select('id')
    .single()

  if (insErr || !insertRow?.id) {
    console.error('[payment/initiate] insert paid_reports', insErr)
    return NextResponse.json({ error: 'Could not reserve your checkout.' }, { status: 500 })
  }

  const rowPk = insertRow.id as string
  const base = paymentAppBaseUrl()
  const productinfo = 'Beetamin Recovery Report'

  const hashPayload = {
    key,
    txnid,
    amount: amountFormatted,
    productinfo,
    firstname,
    email: emailResolved.toLowerCase(),
    udf1: sessionUserId,
    udf2: assessmentId,
    udf3: rowPk,
    udf4: mode,
    udf5: '',
  }

  const hash = generatePayUHash(hashPayload, salt)

  const params: Record<string, string> = {
    key,
    txnid,
    amount: amountFormatted,
    productinfo,
    firstname,
    email: emailResolved.toLowerCase(),
    udf1: sessionUserId,
    udf2: assessmentId,
    udf3: rowPk,
    udf4: mode,
    udf5: '',
    surl: `${base}/api/payment/success`,
    furl: `${base}/api/payment/failure`,
    hash,
    service_provider: 'payu_paisa',
  }

  return NextResponse.json({
    actionUrl: payuUrl,
    params,
    reportSlug: reportId,
    txnid,
    rupees: rupeesServer,
  })
}
