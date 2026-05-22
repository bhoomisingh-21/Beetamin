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
import { giftedPlanMatchesPayment, grantGiftedFullPlan, grantGiftedReport } from '@/lib/gifted-access'
import { hasActiveFullPlanPurchase } from '@/lib/plan-access'
import { reserveUpgradePurchase } from '@/lib/reserve-upgrade-purchase'
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

const MODES = new Set<PaymentMode>(['new', 'retake', 'regenerate', 'upgrade', 'booster'])
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
      { error: 'Required: mode ∈ {new, retake, regenerate, upgrade, booster}.' },
      { status: 400 },
    )
  }

  const rupeesServer = rupeesForPaymentMode(mode)

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('name, email, assessment_result, is_gifted_access, gifted_plan')
    .eq('clerk_user_id', sessionUserId)
    .maybeSingle()

  const giftedActive =
    client?.is_gifted_access === true &&
    typeof client?.gifted_plan === 'string' &&
    client.gifted_plan.length > 0

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
    if (giftedActive && giftedPlanMatchesPayment(client.gifted_plan, 'upgrade')) {
      try {
        const { redirectUrl } = await grantGiftedFullPlan(sessionUserId)
        return NextResponse.json({ giftedBypass: true, redirectUrl })
      } catch (err) {
        console.error('[payment/initiate] gifted full plan', err)
        return NextResponse.json({ error: 'Could not apply gifted plan access.' }, { status: 500 })
      }
    }

    const amountRupees = Math.round(rupeesServer)
    const amountFormatted = `${amountRupees.toFixed(2)}`
    const base = paymentAppBaseUrl()
    const productinfo = 'Beetamin Full Recovery Plan'

    const reserved = await reserveUpgradePurchase(sessionUserId, amountRupees)
    if (!reserved.ok) {
      console.error('[payment/initiate] reserve upgrade', reserved)
      return NextResponse.json(
        {
          error:
            reserved.detail ??
            reserved.message ??
            'Could not reserve your checkout. Please try again in a moment or contact hi@thebeetamin.com.',
          code: reserved.code,
        },
        { status: reserved.code === 'TABLE_MISSING' ? 503 : 500 },
      )
    }

    const recordId = reserved.id
    const txnid = reserved.txnid
    const hashPayload = {
      key,
      txnid,
      amount: amountFormatted,
      productinfo,
      firstname,
      email: emailResolved.toLowerCase(),
      udf1: sessionUserId,
      udf2: 'upgrade',
      udf3: recordId,
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
      ...params,
      payuUrl,
      actionUrl: payuUrl,
      params,
      txnid,
      rupees: rupeesServer,
    })
  }

  if (mode === 'booster') {
    const allowed = await hasActiveFullPlanPurchase(sessionUserId)
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Booster is available only after purchasing the Core Transformation plan.',
          code: 'BOOSTER_REQUIRES_FULL',
        },
        { status: 403 },
      )
    }

    const txnid = makePayUTxnId()
    const amountFormatted = `${rupeesServer.toFixed(2)}`
    const base = paymentAppBaseUrl()
    const productinfo = 'Beetamin Booster Session'

    const { data: purchaseRow, error: purchaseErr } = await supabaseAdmin
      .from('purchases')
      .insert({
        user_id: sessionUserId,
        plan: 'booster',
        amount: Math.round(rupeesServer),
        txnid,
        payment_id: null,
        status: 'pending',
        mode: 'booster',
        sessions_total: 1,
        sessions_used: 0,
      })
      .select('id')
      .single()

    if (purchaseErr || !purchaseRow?.id) {
      console.error('[payment/initiate] insert booster purchase', purchaseErr)
      return NextResponse.json({ error: 'Could not reserve your checkout.' }, { status: 500 })
    }

    const recordId = String(purchaseRow.id)
    const hashPayload = {
      key,
      txnid,
      amount: amountFormatted,
      productinfo,
      firstname,
      email: emailResolved.toLowerCase(),
      udf1: sessionUserId,
      udf2: 'booster',
      udf3: recordId,
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
      ...params,
      payuUrl,
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

  if (
    giftedActive &&
    giftedPlanMatchesPayment(client.gifted_plan, mode as 'new' | 'retake' | 'regenerate')
  ) {
    try {
      const { redirectUrl } = await grantGiftedReport({
        clerkUserId: sessionUserId,
        assessmentId,
        email: emailResolved,
        freeAssessmentSnapshot: freeAssessment,
      })
      return NextResponse.json({ giftedBypass: true, redirectUrl })
    } catch (err) {
      console.error('[payment/initiate] gifted report', err)
      return NextResponse.json({ error: 'Could not apply gifted report access.' }, { status: 500 })
    }
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
      amount: Math.round(rupeesServer),
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
    udf3: rowPk,
    udf4: assessmentId,
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
    udf2: mode,
    udf3: rowPk,
    udf4: assessmentId,
    udf5: '',
    surl: `${base}/api/payment/success`,
    furl: `${base}/api/payment/failure`,
    hash,
    service_provider: 'payu_paisa',
  }

  return NextResponse.json({
    ...params,
    payuUrl,
    actionUrl: payuUrl,
    params,
    reportSlug: reportId,
    txnid,
    rupees: rupeesServer,
  })
}
