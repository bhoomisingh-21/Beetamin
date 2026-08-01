'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { portal } from '@/components/nutritionist-portal/portal-theme'

type Props = {
  open: boolean
  clientName: string
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}

export function CancelSessionModal({ open, clientName, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) setReason('')
  }, [open])

  if (!open) return null

  async function submit() {
    setBusy(true)
    try {
      await onConfirm(reason)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={portal.modalOverlay}>
      <div className={`mt-12 ${portal.modal}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className={`text-lg font-black ${portal.textH}`}>Cancel session</h3>
            <p className={`mt-1 text-sm ${portal.textMuted}`}>{clientName}</p>
          </div>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <label className={`block text-xs font-bold uppercase tracking-wider ${portal.textMuted}`}>
          Reason (optional, shared with client)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Unavailable at this time — please rebook"
          rows={4}
          className={`mt-2 max-h-[min(40vh,320px)] min-h-[100px] resize-y ${portal.input}`}
        />

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => onClose()}
            className={`${portal.btnGhost} px-5 py-3 disabled:opacity-40`}
          >
            Back
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-40"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Confirm cancellation
          </button>
        </div>
      </div>
    </div>
  )
}
