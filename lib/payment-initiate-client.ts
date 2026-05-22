'use client'

import { submitToPayU } from '@/lib/payu-submit'

const PAYU_FIELD_KEYS = [
  'key',
  'txnid',
  'amount',
  'productinfo',
  'firstname',
  'email',
  'udf1',
  'udf2',
  'udf3',
  'udf4',
  'udf5',
  'surl',
  'furl',
  'hash',
  'service_provider',
] as const

function flattenParams(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    out[key] = typeof value === 'string' ? value : String(value ?? '')
  }
  return out.hash ? out : null
}

export function extractPayUCheckout(body: Record<string, unknown>): {
  payuUrl: string
  params: Record<string, string>
} | null {
  const payuUrl =
    typeof body.payuUrl === 'string'
      ? body.payuUrl
      : typeof body.actionUrl === 'string'
        ? body.actionUrl
        : ''
  if (!payuUrl) return null

  const nested = flattenParams(body.params)
  if (nested) return { payuUrl, params: nested }

  const flat: Record<string, string> = {}
  for (const key of PAYU_FIELD_KEYS) {
    const value = body[key]
    if (value != null && value !== '') flat[key] = String(value)
  }
  if (!flat.hash) return null
  return { payuUrl, params: flat }
}

/** Handles gifted bypass JSON or PayU form redirect from `/api/payment/initiate`. */
export function handlePaymentInitiateResponse(
  body: Record<string, unknown>,
  resOk: boolean,
): { kind: 'redirect'; url: string } | { kind: 'payu'; payuUrl: string; params: Record<string, string> } | { kind: 'error'; message: string } {
  if (body.giftedBypass === true && typeof body.redirectUrl === 'string') {
    return { kind: 'redirect', url: body.redirectUrl }
  }

  if (!resOk) {
    const message = typeof body.error === 'string' ? body.error : 'Could not start checkout.'
    return { kind: 'error', message }
  }

  const checkout = extractPayUCheckout(body)
  if (!checkout) {
    return { kind: 'error', message: 'Could not start checkout — invalid payment response.' }
  }

  return { kind: 'payu', ...checkout }
}

export function applyPaymentInitiateResult(
  result: ReturnType<typeof handlePaymentInitiateResponse>,
): void {
  if (result.kind === 'redirect') {
    window.location.href = result.url
    return
  }
  if (result.kind === 'payu') {
    submitToPayU(result.params, result.payuUrl)
  }
}
