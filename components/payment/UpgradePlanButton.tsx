'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { submitToPayU } from '@/lib/payu-submit'

type UpgradePlanButtonProps = {
  children: ReactNode
  className?: string
  disabled?: boolean
  onError?: (message: string) => void
}

function flattenParams(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    out[key] = typeof value === 'string' ? value : String(value ?? '')
  }
  return out.hash ? out : null
}

export function UpgradePlanButton({ children, className, disabled, onError }: UpgradePlanButtonProps) {
  const [busy, setBusy] = useState(false)

  async function startUpgrade() {
    setBusy(true)
    onError?.('')
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 3999, mode: 'upgrade' }),
      })
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>

      if (res.status === 401) {
        window.location.href = '/sign-in?after=' + encodeURIComponent(window.location.pathname)
        return
      }

      const actionUrl = typeof body.actionUrl === 'string' ? body.actionUrl : ''
      const params = flattenParams(body.params)
      if (!res.ok || !actionUrl || !params) {
        throw new Error(typeof body.error === 'string' ? body.error : 'Could not start checkout.')
      }

      submitToPayU(params, actionUrl)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Could not start checkout.')
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => void startUpgrade()}
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
