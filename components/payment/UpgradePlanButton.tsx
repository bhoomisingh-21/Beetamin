'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { submitToPayU } from '@/lib/payu-submit'

type PayuPlanMode = 'upgrade' | 'booster'

type UpgradePlanButtonProps = {
  children: ReactNode
  className?: string
  disabled?: boolean
  onError?: (message: string) => void
  /** Server derives amount from mode — never trust client price. */
  mode?: PayuPlanMode
}

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

function extractPayUCheckout(body: Record<string, unknown>): {
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

export function UpgradePlanButton({
  children,
  className,
  disabled,
  onError,
  mode = 'upgrade',
}: UpgradePlanButtonProps) {
  const [busy, setBusy] = useState(false)

  async function startCheckout() {
    setBusy(true)
    onError?.('')
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>

      if (res.status === 401) {
        window.location.href = '/sign-in?after=' + encodeURIComponent(window.location.pathname)
        return
      }

      if (!res.ok) {
        const message =
          typeof body.error === 'string' ? body.error : 'Could not start checkout.'
        console.error('[UpgradePlanButton] checkout failed', res.status, body)
        throw new Error(message)
      }

      const checkout = extractPayUCheckout(body)
      if (!checkout) {
        console.error('[UpgradePlanButton] invalid PayU payload', body)
        throw new Error('Could not start checkout — invalid payment response.')
      }

      submitToPayU(checkout.params, checkout.payuUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start checkout.'
      console.error('[UpgradePlanButton]', message, error)
      onError?.(message)
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => void startCheckout()}
      className={className}
    >
      {busy ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={16} />
          Opening PayU...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
