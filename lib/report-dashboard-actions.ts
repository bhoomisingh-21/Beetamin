'use server'

import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'

import { paymentUrlForServerFetch } from '@/lib/payment-server-url'
import { payuMerchantConfigured } from '@/lib/payment-app-base-url'
import { triggerRetakePayment } from '@/lib/retake-report-payment'

export type RegeneratePaidReportResult =
  | { ok: false; error: string; code?: string }
  | { ok: true; flow: 'payu'; actionUrl: string; params: Record<string, string> }
  | { ok: true; flow: 'immediate'; reportId: string; status?: string }

/**
 * ₹39 regenerate: after PayU confirms, `/api/payment/success` queues PDF generation for the pending row.
 * When PayU env is absent, retains the stub + `/api/generate-report` flow for local dev.
 */
export async function requestRegeneratePaidReport(detailedAssessmentId: string): Promise<RegeneratePaidReportResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: 'Please sign in again.', code: 'AUTH' }

  const id = detailedAssessmentId.trim()
  if (!id) return { ok: false, error: 'Missing assessment.', code: 'INPUT' }

  if (payuMerchantConfigured()) {
    const hdrs = await headers()
    const cookieStr = hdrs.get('cookie') ?? ''
    const res = await fetch(`${paymentUrlForServerFetch()}/api/payment/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieStr ? { Cookie: cookieStr } : {}),
      },
      body: JSON.stringify({ assessmentId: id, mode: 'regenerate' }),
      cache: 'no-store',
    })

    let body: Record<string, unknown> = {}
    try {
      body = (await res.json()) as Record<string, unknown>
    } catch {
      body = {}
    }

    if (res.status === 503 || body.code === 'PAYU_UNAVAILABLE') {
      // fall through to dev stub
    } else if (!res.ok) {
      const err =
        typeof body.error === 'string'
          ? body.error
          : typeof body.code === 'string'
            ? body.code
            : `Request failed (${res.status})`
      return { ok: false, error: err, code: typeof body.code === 'string' ? body.code : undefined }
    } else {
      const actionUrl = typeof body.actionUrl === 'string' ? body.actionUrl : ''
      const params = typeof body.params === 'object' && body.params !== null && !Array.isArray(body.params)
        ? (body.params as Record<string, string>)
        : {}
      if (!actionUrl || !params.key) {
        return { ok: false, error: 'Invalid PayU initiation response.', code: 'PAYU_INIT' }
      }
      return { ok: true, flow: 'payu', actionUrl, params }
    }
  }

  const payment = await triggerRetakePayment({
    userId,
    assessmentId: id,
    mode: 'regenerate',
    simulateSuccess: true,
  })
  if (!payment.ok) return { ok: false, error: payment.error ?? 'Payment did not complete.' }

  const hdrs = await headers()
  const cookieStr = hdrs.get('cookie') ?? ''

  const genRes = await fetch(`${paymentUrlForServerFetch()}/api/generate-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieStr ? { Cookie: cookieStr } : {}),
    },
    body: JSON.stringify({
      detailedAssessmentId: id,
      forceNewPaidReport: true,
    }),
    cache: 'no-store',
  })

  let genBody: Record<string, unknown> = {}
  try {
    genBody = (await genRes.json()) as Record<string, unknown>
  } catch {
    genBody = {}
  }

  if (!genRes.ok) {
    const err =
      typeof genBody.error === 'string'
        ? genBody.error
        : typeof genBody.code === 'string'
          ? genBody.code
          : `Request failed (${genRes.status})`
    return { ok: false, error: err, code: typeof genBody.code === 'string' ? genBody.code : undefined }
  }

  const reportId = typeof genBody.reportId === 'string' ? genBody.reportId : ''
  if (!reportId) return { ok: false, error: 'Report could not be started.', code: 'MISSING_REPORT_ID' }

  return {
    ok: true,
    flow: 'immediate',
    reportId,
    status: typeof genBody.status === 'string' ? genBody.status : undefined,
  }
}
