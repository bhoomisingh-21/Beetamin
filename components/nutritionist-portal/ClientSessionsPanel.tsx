'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, Lock, Video } from 'lucide-react'
import {
  confirmAppointment,
  createMissingMeetLink,
  nutritionistCancelAppointment,
  rescheduleAppointment,
  type AppointmentWithClient,
} from '@/lib/nutritionist-actions'
import { completePortalAppointment, nutritionistScheduleSession } from '@/lib/nutritionist-portal-actions'
import { computeSessionSlots, type SessionSlot } from '@/lib/nutritionist-utils'
import { CompleteSessionModal } from '@/components/nutritionist-portal/CompleteSessionModal'
import { RescheduleModal } from '@/components/nutritionist-portal/RescheduleModal'
import { CancelSessionModal } from '@/components/nutritionist-portal/CancelSessionModal'
import { ScheduleSessionModal } from '@/components/nutritionist-portal/ScheduleSessionModal'
import { portal } from '@/components/nutritionist-portal/portal-theme'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export function ClientSessionsPanel({
  clientId,
  clientName,
  sessionsTotal,
  sessionsUsed,
  sessionsRemaining,
  appointments,
}: {
  clientId: string
  clientName: string
  sessionsTotal: number
  sessionsUsed: number
  sessionsRemaining: number
  appointments: AppointmentWithClient[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<SessionSlot | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentWithClient | null>(null)
  const [cancelTarget, setCancelTarget] = useState<AppointmentWithClient | null>(null)
  const [completeTarget, setCompleteTarget] = useState<AppointmentWithClient | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(t)
  }, [toast])

  const slots = useMemo(
    () => computeSessionSlots(sessionsTotal, sessionsUsed, appointments),
    [sessionsTotal, sessionsUsed, appointments],
  )

  function refresh() {
    start(() => router.refresh())
  }

  function apptFor(slot: SessionSlot): AppointmentWithClient | undefined {
    if (!slot.appointment) return undefined
    return appointments.find((a) => a.id === slot.appointment!.id)
  }

  async function submitSchedule(date: string, time: string) {
    if (!scheduleTarget) return
    const res = await nutritionistScheduleSession({ clientId, scheduledDate: date, scheduledTime: time })
    if (!res.ok) {
      setToast(res.error)
      throw new Error(res.error)
    }
    setToast(
      res.warning
        ? `Session ${res.sessionNumber} scheduled. ${res.warning}`
        : `Session ${res.sessionNumber} scheduled — Google Meet created and emailed to ${clientName}.`,
    )
    refresh()
  }

  async function handleAccept(a: AppointmentWithClient) {
    setBusyId(a.id)
    try {
      const res = await confirmAppointment(a.id)
      if (!res.ok) {
        setToast(res.error)
        return
      }
      setToast(
        res.warning
          ? `Session accepted. ${res.warning}`
          : 'Session accepted — Google Meet link created and emailed to the client.',
      )
      refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function handleCreateMeetLink(a: AppointmentWithClient) {
    setBusyId(a.id)
    try {
      const res = await createMissingMeetLink(a.id)
      if (!res.ok) {
        setToast(res.error)
        return
      }
      setToast('Google Meet link created and emailed to the client.')
      refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function submitReschedule(newDate: string, newTime: string) {
    if (!rescheduleTarget) return
    const res = await rescheduleAppointment(rescheduleTarget.id, newDate, newTime)
    if (!res.ok) {
      setToast(res.error)
      throw new Error(res.error)
    }
    setToast(res.warning ? `Session rescheduled. ${res.warning}` : 'Session rescheduled — client notified by email.')
    refresh()
  }

  async function submitCancel(reason: string) {
    if (!cancelTarget) return
    const res = await nutritionistCancelAppointment(cancelTarget.id, reason || undefined)
    if (!res.ok) {
      setToast(res.error)
      throw new Error(res.error)
    }
    setToast('Session cancelled — this slot is open again, generate a new link whenever you\u2019re ready.')
    refresh()
  }

  async function submitComplete(note: string) {
    if (!completeTarget) return
    const res = await completePortalAppointment(completeTarget.id, note)
    if (!res.ok) {
      setToast(res.error || 'Could not complete session')
      throw new Error(res.error || 'fail')
    }
    setToast('Session marked complete — next session unlocked.')
    refresh()
  }

  if (!sessionsTotal || sessionsTotal <= 0) {
    return (
      <div className={`${portal.cardEmpty}`}>
        <p className={`text-sm font-semibold ${portal.textH}`}>{clientName} isn&apos;t on an active plan yet.</p>
        <p className={`mt-2 text-sm ${portal.textMuted}`}>
          Grant them plan access from Admin → Gift Access to unlock their 6 consultation sessions.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {toast && <div className={portal.toast}>{toast}</div>}

      <ScheduleSessionModal
        open={!!scheduleTarget}
        clientName={clientName}
        sessionNumber={scheduleTarget?.sessionNumber ?? 0}
        onClose={() => setScheduleTarget(null)}
        onConfirm={submitSchedule}
      />
      <RescheduleModal
        open={!!rescheduleTarget}
        clientName={clientName}
        currentDate={rescheduleTarget?.scheduled_date ?? ''}
        currentTime={rescheduleTarget?.scheduled_time ?? ''}
        onClose={() => setRescheduleTarget(null)}
        onConfirm={submitReschedule}
      />
      <CancelSessionModal
        open={!!cancelTarget}
        clientName={clientName}
        onClose={() => setCancelTarget(null)}
        onConfirm={submitCancel}
      />
      <CompleteSessionModal
        open={!!completeTarget}
        clientName={clientName}
        onClose={() => setCompleteTarget(null)}
        onConfirm={submitComplete}
      />

      <div className="flex items-center justify-between">
        <p className={`text-sm ${portal.textMuted}`}>
          <span className={`font-bold ${portal.textAccent}`}>{sessionsUsed}</span> of{' '}
          <span className="font-bold">{sessionsTotal}</span> sessions completed ·{' '}
          <span className="font-bold">{sessionsRemaining}</span> remaining
        </p>
        {pending && (
          <span className={`flex items-center gap-2 text-xs ${portal.textMuted}`}>
            <Loader2 className="animate-spin text-emerald-600" size={14} />
            Updating…
          </span>
        )}
      </div>

      <ul className="space-y-3">
        {slots.map((slot) => {
          const a = apptFor(slot)
          const rowBusy = pending || (a ? busyId === a.id : false)
          return (
            <li
              key={slot.sessionNumber}
              className={`${portal.card} flex flex-wrap items-center justify-between gap-4 p-4 ${
                slot.state === 'locked' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                    slot.state === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : slot.state === 'locked'
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {slot.state === 'completed' ? <CheckCircle size={18} /> : slot.state === 'locked' ? <Lock size={16} /> : slot.sessionNumber}
                </span>
                <div>
                  <p className={`font-bold ${portal.textH}`}>Session {slot.sessionNumber}</p>
                  {slot.state === 'completed' && (
                    <p className="text-xs font-semibold text-emerald-600">Completed{a ? ` · ${formatDate(a.scheduled_date)}` : ''}</p>
                  )}
                  {slot.state === 'confirmed' && a && (
                    <p className={`text-xs ${portal.textMuted}`}>
                      {formatDate(a.scheduled_date)} · {formatTime(a.scheduled_time)}
                    </p>
                  )}
                  {slot.state === 'pending' && a && (
                    <p className="text-xs font-semibold text-amber-600">
                      Client requested {formatDate(a.scheduled_date)} · {formatTime(a.scheduled_time)}
                    </p>
                  )}
                  {slot.state === 'active_empty' && <p className="text-xs font-semibold text-emerald-600">Active — not scheduled yet</p>}
                  {slot.state === 'locked' && <p className="text-xs text-slate-400">Complete session {slot.sessionNumber - 1} to unlock</p>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {slot.state === 'active_empty' && (
                  <button
                    type="button"
                    disabled={rowBusy}
                    onClick={() => setScheduleTarget(slot)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold ${portal.btnPrimary} disabled:opacity-40`}
                  >
                    Generate Meet link
                  </button>
                )}
                {slot.state === 'pending' && a && (
                  <button
                    type="button"
                    disabled={rowBusy}
                    onClick={() => void handleAccept(a)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold ${portal.btnPrimary} disabled:opacity-40`}
                  >
                    {busyId === a.id ? <Loader2 className="animate-spin" size={14} /> : 'Accept'}
                  </button>
                )}
                {(slot.state === 'pending' || slot.state === 'confirmed') && a && (
                  <>
                    <button
                      type="button"
                      disabled={rowBusy}
                      onClick={() => setRescheduleTarget(a)}
                      className={`rounded-xl px-3 py-2 text-xs font-bold ${portal.btnOutline} disabled:opacity-40`}
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      disabled={rowBusy}
                      onClick={() => setCancelTarget(a)}
                      className="rounded-xl border border-red-300 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {slot.state === 'confirmed' && a?.meet_link && (
                  <a
                    href={a.meet_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
                  >
                    <Video size={14} />
                    Join
                  </a>
                )}
                {slot.state === 'confirmed' && a && !a.meet_link && (
                  <button
                    type="button"
                    disabled={rowBusy}
                    onClick={() => void handleCreateMeetLink(a)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-40"
                  >
                    {busyId === a.id ? <Loader2 className="animate-spin" size={14} /> : <Video size={14} />}
                    Create Meet link
                  </button>
                )}
                {slot.state === 'confirmed' && a && (
                  <button
                    type="button"
                    disabled={rowBusy}
                    onClick={() => setCompleteTarget(a)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold ${portal.btnPrimary} disabled:opacity-40`}
                  >
                    Complete
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
