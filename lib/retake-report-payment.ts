/**
 * Dev-only shim when PayU credentials are absent (`503 PAYU_UNAVAILABLE` from `/api/payment/initiate`).
 * Production regenerate flow uses PayU Hosted Checkout → `/api/payment/success` → `runPaidReportGeneration`.
 */
export async function triggerRetakePayment(input: {
  userId: string
  assessmentId: string
  mode: 'retake' | 'regenerate'
  /** Default true — set false once payment gateway confirms. */
  simulateSuccess?: boolean
}): Promise<{ ok: boolean; error?: string }> {
  // eslint-disable-next-line no-console -- dev visibility until checkout exists
  console.log('[triggerRetakePayment] TODO checkout', input.mode, input.assessmentId)

  const ok = input.simulateSuccess !== false
  if (!ok) return { ok: false, error: 'Payment gateway not wired yet.' }
  return { ok: true }
}
