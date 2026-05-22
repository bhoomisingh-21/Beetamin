'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { trackEvent } from '@/lib/analytics'
import {
  applyPaymentInitiateResult,
  handlePaymentInitiateResponse,
} from '@/lib/payment-initiate-client'

type PayuPlanMode = 'upgrade' | 'booster'

type UpgradePlanButtonProps = {
  children: ReactNode
  className?: string
  disabled?: boolean
  onError?: (message: string) => void
  /** Server derives amount from mode — never trust client price. */
  mode?: PayuPlanMode
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
    if (mode === 'upgrade') {
      trackEvent('payment_initiated', { plan: 'full_plan', amount: 3999 })
    }
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

      const result = handlePaymentInitiateResponse(body, res.ok)
      if (result.kind === 'error') {
        console.error('[UpgradePlanButton] checkout failed', res.status, body.code, body)
        throw new Error(result.message)
      }

      applyPaymentInitiateResult(result)
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
