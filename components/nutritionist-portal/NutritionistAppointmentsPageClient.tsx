'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import type { AppointmentWithClient } from '@/lib/nutritionist-actions'
import { completePortalAppointment } from '@/lib/nutritionist-portal-actions'
import { CompleteSessionModal } from '@/components/nutritionist-portal/CompleteSessionModal'

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

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3800)
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

  const pills: { key: TabKey; label: string }[] = [
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'pending', label: 'Pending' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'completed', label: 'Completed' },
  ]

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[110] max-w-md -translate-x-1/2 rounded-xl border border-white/10 bg-[#0F1623] px-5 py-3 text-sm font-semibold text-[#F0F4F8] shadow-xl">
          {toast}
        </div>
      )}

      <CompleteSessionModal
        open={!!completeTarget}
        clientName={completeTarget?.clients?.name ?? ''}
        onClose={() => setCompleteTarget(null)}
        onConfirm={submitComplete}
      />

      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#F0F4F8]">Appointments</h1>
        <p className="mt-1 text-sm text-[#8B9AB0]">Full session history — nothing is hidden after completion</p>
        <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
      </div>

      <div className="flex flex-wrap gap-2">
        {pills.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setTab(p.key)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              tab === p.key
                ? 'bg-emerald-500 text-black'
                : 'border border-white/[0.08] bg-[#0F1623] text-[#8B9AB0] hover:border-emerald-500/25'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pending && (
        <div className="flex items-center gap-2 text-sm text-[#8B9AB0]">
          <Loader2 className="animate-spin text-emerald-500" size={16} />
          Updating…
        </div>
      )}

      <div className="hidden overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#0F1623] md:block">
        <table className="min-w-full divide-y divide-white/[0.06] text-left text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-[#8B9AB0]">
              <th className="px-4 py-3">Date &amp; time</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {filtered.map((a) => (
              <tr key={a.id} className={`${rowAccent(a.status)} align-top`}>
                <td className="whitespace-nowrap px-4 py-4 text-[#F0F4F8]">
                  <div className="font-semibold">{formatDateShort(a.scheduled_date)}</div>
                  <div className="text-xs text-[#8B9AB0]">{formatTime(a.scheduled_time)}</div>
                </td>
                <td className="max-w-[200px] px-4 py-4">
                  <div className="font-semibold text-[#F0F4F8]">{a.clients.name}</div>
                  <div className="truncate text-xs text-[#8B9AB0]">{a.clients.email}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-emerald-400">
                    Session {a.session_number}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {a.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/12 px-3 py-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle size={14} />
                      Completed
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase text-[#8B9AB0]">
                      {a.status}
                    </span>
                  )}
                </td>
                <td className="max-w-[240px] px-4 py-4 text-xs leading-snug text-[#8B9AB0]">
                  {a.status === 'completed' ? previewNote(a.notes) : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/nutritionist/clients/${a.clients.id}`}
                      className="rounded-xl border border-emerald-500/35 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10"
                    >
                      View profile
                    </Link>
                    {a.status === 'confirmed' && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setCompleteTarget(a)}
                        className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-40"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-[#8B9AB0]">No sessions in this tab.</p>
        )}
      </div>

      <ul className="space-y-3 md:hidden">
        {filtered.map((a) => (
          <li
            key={a.id}
            className={`rounded-2xl border border-white/[0.06] bg-[#0F1623] p-4 ${rowAccent(a.status)}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold text-[#F0F4F8]">{a.clients.name}</p>
                <p className="text-xs text-[#8B9AB0]">{a.clients.email}</p>
              </div>
              {a.status === 'completed' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                  <CheckCircle size={12} />
                  Completed
                </span>
              ) : (
                <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase text-[#8B9AB0]">
                  {a.status}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-[#F0F4F8]">
              {formatDateShort(a.scheduled_date)} · {formatTime(a.scheduled_time)}
            </p>
            <p className="mt-1 text-xs font-bold text-emerald-400">Session {a.session_number}</p>
            {a.status === 'completed' && (
              <p className="mt-2 rounded-lg bg-black/20 px-3 py-2 text-xs text-[#8B9AB0]">
                {previewNote(a.notes, 140)}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/nutritionist/clients/${a.clients.id}`}
                className="flex-1 rounded-xl border border-emerald-500/35 py-2.5 text-center text-xs font-bold text-emerald-400"
              >
                View profile
              </Link>
              {a.status === 'confirmed' && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setCompleteTarget(a)}
                  className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-black disabled:opacity-40"
                >
                  Complete
                </button>
              )}
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-dashed border-white/[0.12] bg-[#0F1623]/50 px-6 py-12 text-center text-sm text-[#8B9AB0]">
            No sessions in this tab.
          </li>
        )}
      </ul>
    </div>
  )
}
