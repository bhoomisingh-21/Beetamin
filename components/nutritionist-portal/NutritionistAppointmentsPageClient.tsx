'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { CheckCircle, Loader2, Video } from 'lucide-react'
import {
  confirmAppointment,
  createMissingMeetLink,
  nutritionistCancelAppointment,
  rescheduleAppointment,
  type AppointmentWithClient,
} from '@/lib/nutritionist-actions'
import { completePortalAppointment } from '@/lib/nutritionist-portal-actions'
import { CompleteSessionModal } from '@/components/nutritionist-portal/CompleteSessionModal'
import { RescheduleModal } from '@/components/nutritionist-portal/RescheduleModal'
import { CancelSessionModal } from '@/components/nutritionist-portal/CancelSessionModal'
import { portal } from '@/components/nutritionist-portal/portal-theme'

type TabKey = 'scheduled' | 'pending' | 'cancelled' | 'completed'

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function previewNote(text: string | null | undefined, max = 96) {
  if (!text?.trim()) return '—'
  const s = text.trim().replace(/\s+/g, ' ')
  return s.length <= max ? s : `${s.slice(0, max)}…`
}

function tabForRow(status: string): TabKey {
  if (status === 'completed') return 'completed'
  if (status === 'pending') return 'pending'
  if (status === 'cancelled' || status === 'rejected') return 'cancelled'
  if (status === 'confirmed') return 'scheduled'
  return 'scheduled'
}

function rowAccent(status: string) {
  if (status === 'completed') return 'border-l-4 border-l-emerald-500'
  return ''
}

export default function NutritionistAppointmentsPageClient({
  appointments,
}: {
  appointments: AppointmentWithClient[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [tab, setTab] = useState<TabKey>('scheduled')
  const [toast, setToast] = useState<string | null>(null)
  const [completeTarget, setCompleteTarget] = useState<AppointmentWithClient | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentWithClient | null>(null)
  const [cancelTarget, setCancelTarget] = useState<AppointmentWithClient | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    return appointments.filter((a) => tabForRow(a.status) === tab)
  }, [appointments, tab])

  function refresh() {
    start(() => {
      router.refresh()
    })
  }

  async function submitComplete(note: string) {
    if (!completeTarget) return
    const res = await completePortalAppointment(completeTarget.id, note)
    if (!res.ok) {
      setToast(res.error || 'Could not complete session')
      throw new Error(res.error || 'fail')
    }
    setToast('Session marked complete')
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
          : res.meetLink
            ? 'Session accepted — Google Meet link created and emailed to the client.'
            : 'Session accepted.',
      )
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

  async function submitCancel(reason: string) {
    if (!cancelTarget) return
    const res = await nutritionistCancelAppointment(cancelTarget.id, reason || undefined)
    if (!res.ok) {
      setToast(res.error)
      throw new Error(res.error)
    }
    setToast('Session cancelled — client notified by email.')
    refresh()
  }

  const pills: { key: TabKey; label: string }[] = [
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'pending', label: 'Pending' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'completed', label: 'Completed' },
  ]

  function ActionButtons({ a }: { a: AppointmentWithClient }) {
    const rowBusy = pending || busyId === a.id
    return (
      <>
        {a.status === 'pending' && (
          <button
            type="button"
            disabled={rowBusy}
            onClick={() => void handleAccept(a)}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${portal.btnPrimary} disabled:opacity-40`}
          >
            {busyId === a.id ? <Loader2 className="animate-spin" size={14} /> : 'Accept'}
          </button>
        )}
        {(a.status === 'pending' || a.status === 'confirmed') && (
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
        {a.status === 'confirmed' && a.meet_link && (
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
        {a.status === 'confirmed' && !a.meet_link && (
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
        {a.status === 'confirmed' && (
          <button
            type="button"
            disabled={rowBusy}
            onClick={() => setCompleteTarget(a)}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${portal.btnPrimary} disabled:opacity-40`}
          >
            Complete
          </button>
        )}
      </>
    )
  }

  return (
    <div className="space-y-8">
      {toast && <div className={portal.toast}>{toast}</div>}

      <CompleteSessionModal
        open={!!completeTarget}
        clientName={completeTarget?.clients?.name ?? ''}
        onClose={() => setCompleteTarget(null)}
        onConfirm={submitComplete}
      />

      <RescheduleModal
        open={!!rescheduleTarget}
        clientName={rescheduleTarget?.clients?.name ?? ''}
        currentDate={rescheduleTarget?.scheduled_date ?? ''}
        currentTime={rescheduleTarget?.scheduled_time ?? ''}
        onClose={() => setRescheduleTarget(null)}
        onConfirm={submitReschedule}
      />

      <CancelSessionModal
        open={!!cancelTarget}
        clientName={cancelTarget?.clients?.name ?? ''}
        onClose={() => setCancelTarget(null)}
        onConfirm={submitCancel}
      />

      <div>
        <h1 className={portal.heading}>Appointments</h1>
        <p className={portal.subtext}>Full session history — nothing is hidden after completion</p>
        <div className={portal.accentBar} aria-hidden />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
        {pills.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setTab(p.key)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              tab === p.key
                ? portal.tabActive
                : portal.tabIdle
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pending && (
        <div className={`flex items-center gap-2 text-sm ${portal.textMuted}`}>
          <Loader2 className="animate-spin text-emerald-600" size={16} />
          Updating…
        </div>
      )}

      <div className={`hidden overflow-x-auto md:block ${portal.card}`}>
        <table className={`min-w-full divide-y ${portal.divider} text-left text-sm`}>
          <thead>
            <tr className={`text-[11px] font-bold uppercase tracking-wider ${portal.textMuted}`}>
              <th className="px-4 py-3">Date &amp; time</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${portal.divider}`}>
            {filtered.map((a) => (
              <tr key={a.id} className={`${rowAccent(a.status)} align-top`}>
                <td className={`whitespace-nowrap px-4 py-4 ${portal.textH}`}>
                  <div className="font-semibold">{formatDateShort(a.scheduled_date)}</div>
                  <div className={`text-xs ${portal.textMuted}`}>{formatTime(a.scheduled_time)}</div>
                </td>
                <td className="max-w-[200px] px-4 py-4">
                  <div className={`font-semibold ${portal.textH}`}>{a.clients.name}</div>
                  <div className={`truncate text-xs ${portal.textMuted}`}>
                    Session {a.session_number} of {a.clients.sessions_used + a.clients.sessions_remaining}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    Session {a.session_number}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {a.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle size={14} />
                      Completed
                    </span>
                  ) : (
                    <span className={`rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase ${portal.textMuted}`}>
                      {a.status}
                    </span>
                  )}
                </td>
                <td className={`max-w-[240px] px-4 py-4 text-xs leading-snug ${portal.textMuted}`}>
                  {a.status === 'completed' ? previewNote(a.notes) : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/nutritionist/clients/${a.clients.id}`}
                      className={`rounded-xl px-3 py-2 text-xs font-bold ${portal.btnOutline}`}
                    >
                      View profile
                    </Link>
                    <ActionButtons a={a} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className={`px-6 py-12 text-center text-sm ${portal.textMuted}`}>No sessions in this tab.</p>
        )}
      </div>

      <ul className="space-y-3 md:hidden">
        {filtered.map((a) => (
          <li
            key={a.id}
            className={`${portal.card} p-4 ${rowAccent(a.status)}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className={`font-bold ${portal.textH}`}>{a.clients.name}</p>
                <p className={`text-xs ${portal.textMuted}`}>
                  Session {a.session_number} · {formatDateShort(a.scheduled_date)}
                </p>
              </div>
              {a.status === 'completed' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  <CheckCircle size={12} />
                  Completed
                </span>
              ) : (
                <span className={`rounded-full border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase ${portal.textMuted}`}>
                  {a.status}
                </span>
              )}
            </div>
            <p className={`mt-2 text-sm ${portal.textH}`}>
              {formatDateShort(a.scheduled_date)} · {formatTime(a.scheduled_time)}
            </p>
            <p className="mt-1 text-xs font-bold text-emerald-700">Session {a.session_number}</p>
            {a.status === 'completed' && (
              <p className={`mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs ${portal.textMuted}`}>
                {previewNote(a.notes, 140)}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/nutritionist/clients/${a.clients.id}`}
                className={`flex-1 py-2.5 text-center text-xs font-bold ${portal.btnOutline}`}
              >
                View profile
              </Link>
              <ActionButtons a={a} />
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className={`${portal.cardEmpty} py-12 text-sm ${portal.textMuted}`}>
            No sessions in this tab.
          </li>
        )}
      </ul>
    </div>
  )
}
