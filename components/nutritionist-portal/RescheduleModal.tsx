'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { portal } from '@/components/nutritionist-portal/portal-theme'

type Props = {
  open: boolean
  clientName: string
  currentDate: string
  currentTime: string
  onClose: () => void
  onConfirm: (newDate: string, newTime: string) => Promise<void>
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function RescheduleModal({ open, clientName, currentDate, currentTime, onClose, onConfirm }: Props) {
  const [date, setDate] = useState(currentDate)
  const [time, setTime] = useState(currentTime.slice(0, 5))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setDate(currentDate)
      setTime(currentTime.slice(0, 5))
      setError('')
    }
  }, [open, currentDate, currentTime])

  if (!open) return null

  async function submit() {
    if (!date || !time) {
      setError('Pick a new date and time.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onConfirm(date, time)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reschedule.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={portal.modalOverlay}>
      <div className={`mt-12 ${portal.modal}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className={`text-lg font-black ${portal.textH}`}>Reschedule session</h3>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${portal.textMuted}`}>New date</label>
            <input
              type="date"
              value={date}
              min={todayIso()}
              onChange={(e) => setDate(e.target.value)}
              className={`mt-2 ${portal.input}`}
            />
          </div>
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${portal.textMuted}`}>New time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`mt-2 ${portal.input}`}
            />
          </div>
        </div>

        <p className={`mt-3 text-xs ${portal.textMuted}`}>
          The client will be emailed the new date/time along with an updated Google Meet link.
        </p>

        {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => onClose()}
            className={`${portal.btnGhost} px-5 py-3 disabled:opacity-40`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 ${portal.btnPrimary} disabled:opacity-40`}
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : null}
            Confirm reschedule
          </button>
        </div>
      </div>
    </div>
  )
}
