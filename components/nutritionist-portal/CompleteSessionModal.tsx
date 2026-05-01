'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'

type Props = {
  open: boolean
  clientName: string
  onClose: () => void
  onConfirm: (note: string) => Promise<void>
}

export function CompleteSessionModal({ open, clientName, onClose, onConfirm }: Props) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) setNote('')
  }, [open])

  if (!open) return null

  async function submit() {
    setBusy(true)
    try {
      await onConfirm(note)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="mt-12 w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0F1623] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#F0F4F8]">Complete session</h3>
            <p className="mt-1 text-sm text-[#8B9AB0]">{clientName}</p>
          </div>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            className="rounded-lg p-2 text-[#8B9AB0] hover:bg-white/5 hover:text-[#F0F4F8]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs font-bold uppercase tracking-wider text-[#8B9AB0]">
          Session note
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write your clinical note for this session…"
          rows={6}
          className="mt-2 max-h-[min(50vh,420px)] min-h-[144px] w-full resize-y rounded-xl border border-white/[0.08] bg-[#060910] px-4 py-3 text-sm text-[#F0F4F8] outline-none ring-emerald-500/15 focus:ring-2"
        />

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => onClose()}
            className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-[#8B9AB0] hover:bg-white/5 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-40"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Confirm complete
          </button>
        </div>
      </div>
    </div>
  )
}
