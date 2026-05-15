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

function flattenParams(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    out[key] = typeof value === 'string' ? value : String(value ?? '')
  }
  return out.hash ? out : null
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

      const payuUrl =
        typeof body.payuUrl === 'string'
          ? body.payuUrl
          : typeof body.actionUrl === 'string'
            ? body.actionUrl
            : ''
      const nestedParams = flattenParams(body.params)
      const { payuUrl: _payuUrl, actionUrl: _actionUrl, params: _params, ...flatParams } = body
      const params = nestedParams ?? flattenParams(flatParams)
      if (!res.ok || !payuUrl || !params) {
        throw new Error(typeof body.error === 'string' ? body.error : 'Could not start checkout.')
      }

      submitToPayU(params, payuUrl)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Could not start checkout.')
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
