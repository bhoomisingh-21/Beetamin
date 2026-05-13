import { auth, currentUser } from '@clerk/nextjs/server'
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

const MODES = new Set<PaymentMode>(['new', 'retake', 'regenerate', 'upgrade'])
const REPORT_MODES = new Set<PaymentMode>(['new', 'retake', 'regenerate'])

export async function GET() {
  return new NextResponse(null, { status: 405 })
}

/** PayU checkout. Report modes are ₹39; Full Recovery Plan upgrade is ₹3,999. */
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

  const mode = body.mode

  if (!mode || !MODES.has(mode)) {
    return NextResponse.json(
      { error: 'Required: mode ∈ {new, retake, regenerate, upgrade}.' },
      { status: 400 },
    )
  }

  const rupeesServer = rupeesForPaymentMode(mode)

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('name, email, assessment_result')
    .eq('clerk_user_id', sessionUserId)
    .maybeSingle()

  const clerkUser = !client ? await currentUser() : null
  const emailResolved =
    (typeof client?.email === 'string' ? client.email.trim() : '') ||
    clerkUser?.primaryEmailAddress?.emailAddress?.trim() ||
    `noemail_${sessionUserId.slice(-14)}@beetamin.internal`
  const displayName =
    (typeof client?.name === 'string' ? client.name.trim() : '') ||
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    'Patient'
  const firstname = firstNameFrom(displayName)

  if (mode === 'upgrade') {
    const txnid = makePayUTxnId()
    const amountFormatted = `${rupeesServer.toFixed(2)}`
    const base = paymentAppBaseUrl()
    const productinfo = 'Beetamin Full Recovery Plan'

    const { error: purchaseErr } = await supabaseAdmin.from('purchases').insert({
      user_id: sessionUserId,
      plan: 'full',
      amount: rupeesServer,
      status: 'pending',
      payment_id: null,
      txnid,
    })

    if (purchaseErr) {
      console.error('[payment/initiate] insert purchases', purchaseErr)
      return NextResponse.json({ error: 'Could not reserve your checkout.' }, { status: 500 })
    }

    const hashPayload = {
      key,
      txnid,
      amount: amountFormatted,
      productinfo,
      firstname,
      email: emailResolved.toLowerCase(),
      udf1: sessionUserId,
      udf2: 'upgrade',
      udf3: '',
      udf4: '',
      udf5: '',
    }

    const params: Record<string, string> = {
      ...hashPayload,
      surl: `${base}/api/payment/success`,
      furl: `${base}/api/payment/failure`,
      hash: generatePayUHash(hashPayload, salt),
      service_provider: 'payu_paisa',
    }

    return NextResponse.json({
      actionUrl: payuUrl,
      params,
      txnid,
      rupees: rupeesServer,
    })
  }

  const assessmentId = typeof body.assessmentId === 'string' ? body.assessmentId.trim() : ''
  if (!assessmentId || !REPORT_MODES.has(mode)) {
    return NextResponse.json(
      { error: 'Required for report checkout: assessmentId and mode ∈ {new, retake, regenerate}.' },
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
    udf2: mode,
    udf3: reportId,
    udf4: rowPk,
    udf5: assessmentId,
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
    udf2: mode,
    udf3: reportId,
    udf4: rowPk,
    udf5: assessmentId,
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
