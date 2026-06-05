'use client'

import {
  applyPaymentInitiateResult,
  handlePaymentInitiateResponse,
} from '@/lib/payment-initiate-client'

export type StartReport39PaymentInput = {
  detailedAssessmentId: string
  mode?: 'new' | 'retake' | 'regenerate'
  freeAssessmentSnapshot?: Record<string, unknown> | null
  assessmentMeta?: Record<string, unknown> | null
}

/**
 * Starts ₹39 PayU checkout (form POST — no full-page loader).
 * Returns null on success (browser navigates to PayU). Returns error string on failure.
 */
export async function startReport39Payment(
  input: StartReport39PaymentInput,
): Promise<string | null> {
  const payRes = await fetch('/api/payment/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assessmentId: input.detailedAssessmentId,
      mode: input.mode ?? 'new',
      ...(input.freeAssessmentSnapshot
        ? {
            freeAssessmentSnapshot: input.freeAssessmentSnapshot,
            assessmentMeta: input.assessmentMeta ?? null,
          }
        : {}),
    }),
  })

  let payJson: Record<string, unknown> = {}
  try {
    payJson = (await payRes.json()) as Record<string, unknown>
  } catch {
    payJson = {}
  }

  const payResult = handlePaymentInitiateResponse(payJson, payRes.ok)
  if (payResult.kind === 'redirect') {
    window.location.href = payResult.url
    return null
  }
  if (payResult.kind === 'payu') {
    applyPaymentInitiateResult(payResult)
    return null
  }

  if (payRes.status === 503 && payJson.code === 'PAYU_UNAVAILABLE') {
    const genRes = await fetch('/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        detailedAssessmentId: input.detailedAssessmentId,
        freeAssessmentResult: input.freeAssessmentSnapshot ?? undefined,
      }),
    })
    const genJson = (await genRes.json().catch(() => ({}))) as {
      reportId?: string
      error?: string
    }
    if (!genRes.ok) {
      return typeof genJson.error === 'string' ? genJson.error : 'Could not start your report.'
    }
    if (genJson.reportId) {
      window.location.href = `/report/${encodeURIComponent(genJson.reportId)}`
      return null
    }
    return 'Could not start your report.'
  }

  return payResult.kind === 'error'
    ? payResult.message
    : typeof payJson.error === 'string'
      ? payJson.error
      : 'Checkout could not start.'
}
