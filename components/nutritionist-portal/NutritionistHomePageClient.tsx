'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clock,
  Loader2,
  Users,
  ClipboardList,
  ChevronRight,
} from 'lucide-react'
import { completePortalAppointment } from '@/lib/nutritionist-portal-actions'
import type { PortalHomePayload, SlotStatus } from '@/lib/nutritionist-types'
import { confirmAppointment, type AppointmentWithClient } from '@/lib/nutritionist-actions'
import { CompleteSessionModal } from '@/components/nutritionist-portal/CompleteSessionModal'
import { portal } from '@/components/nutritionist-portal/portal-theme'

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function avatarColor(name: string): string {
  const PAL = ['#059669', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0d9488']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % 997
  return PAL[h % PAL.length]
}

function slotBadge(status: SlotStatus) {
  const map: Record<SlotStatus, string> = {
    Upcoming: 'border-slate-200 bg-slate-50 text-slate-600',
    'In Progress': 'border-emerald-300 bg-emerald-50 text-emerald-700',
    Completed: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  }
  return map[status]
}

function sessionsTotal(c: AppointmentWithClient['clients']) {
  const ext = c as { sessions_total?: number }
  return ext.sessions_total ?? c.sessions_used + c.sessions_remaining
}

export default function NutritionistHomePageClient({ initial }: { initial: PortalHomePayload }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  const [completeTarget, setCompleteTarget] = useState<(typeof initial.todaySessions)[number] | null>(
    null,
  )

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3800)
    return () => window.clearTimeout(t)
  }, [toast])

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
    setToast('Session completed')
    refresh()
  }

  function quickConfirm(id: string) {
    start(async () => {
      await confirmAppointment(id)
      refresh()
    })
  }

  const { stats, todaySessions, upcomingSevenDays, pendingRequests } = initial

  const statCards = [
    { label: 'Active clients', value: stats.activeClients },
    { label: 'Sessions this week', value: stats.sessionsThisWeek },
    { label: 'Sessions today', value: stats.sessionsToday },
    { label: 'Upcoming confirmed', value: stats.pendingBookings },
  ]

  return (
    <div className="space-y-10">
      {toast && (
        <div className={portal.toast}>
          {toast}
        </div>
      )}

      <CompleteSessionModal
        open={!!completeTarget}
        clientName={completeTarget?.clients?.name ?? ''}
        onClose={() => setCompleteTarget(null)}
        onConfirm={submitComplete}
      />

      <div className={`flex flex-wrap items-center gap-2 border-b ${portal.divider} pb-4`}>
        <Link
          href="/nutritionist-dashboard"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700"
        >
          <ChevronLeft size={18} aria-hidden />
          Back to quick dashboard
        </Link>
      </div>

      <div>
        <h1 className={portal.heading}>Dashboard</h1>
        <p className={portal.subtext}>Sessions and clients at a glance</p>
        <div className={portal.accentBar} aria-hidden />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`${portal.card} px-4 py-5`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-wider ${portal.textMuted}`}>{s.label}</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-emerald-600">{s.value}</p>
          </div>
        ))}
      </div>

      {pendingRequests.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-black text-amber-800">
            <ClipboardList size={18} />
            Pending confirmations ({pendingRequests.length})
          </h2>
          <ul className="mt-4 space-y-3">
            {pendingRequests.slice(0, 8).map((a) => (
              <li
                key={a.id}
                className={`flex flex-wrap items-center justify-between gap-3 ${portal.cardMuted} px-4 py-3`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-black text-white"
                    style={{ backgroundColor: avatarColor(a.clients.name) }}
                  >
                    {initials(a.clients.name)}
                  </div>
                  <div>
                    <p className={`font-semibold ${portal.textH}`}>{a.clients.name}</p>
                    <p className={`text-xs ${portal.textMuted}`}>
                      {formatDateShort(a.scheduled_date)} · {formatTime(a.scheduled_time)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => quickConfirm(a.id)}
                  className={`rounded-full px-4 py-2 text-xs font-bold ${portal.btnPrimary} disabled:opacity-50`}
                >
                  {pending ? <Loader2 className="animate-spin" size={14} /> : 'Confirm'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className={`text-lg font-black ${portal.textH}`}>Today&apos;s sessions</h2>
          <div className="flex items-center gap-3">
            {pending && <Loader2 className="animate-spin text-emerald-600" size={18} />}
            <Link
              href="/nutritionist/appointments"
              className={`text-xs font-bold ${portal.textAccent} hover:underline`}
            >
              All appointments →
            </Link>
          </div>
        </div>

        {todaySessions.length === 0 ? (
          <div className={portal.cardEmpty}>
            <Calendar className={`mx-auto ${portal.textMuted}`} size={36} />
            <p className={`mt-4 font-semibold ${portal.textH}`}>No sessions scheduled for today</p>
            <p className={`mt-1 text-sm ${portal.textMuted}`}>Confirmed or pending requests will show here.</p>
            <Link
              href="/nutritionist/clients"
              className={`mt-6 inline-flex items-center gap-2 px-5 py-3 text-sm font-bold ${portal.btnOutline}`}
            >
              <Users size={18} />
              View all clients
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {todaySessions.map((a) => (
              <li
                key={a.id}
                className={`flex flex-col gap-4 ${portal.card} p-4 md:flex-row md:items-center md:justify-between`}
              >
                <div className="flex flex-1 flex-wrap items-center gap-4">
                  <div className="text-lg font-black tabular-nums text-emerald-600">{formatTime(a.scheduled_time)}</div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white"
                      style={{ backgroundColor: avatarColor(a.clients.name) }}
                    >
                      {initials(a.clients.name)}
                    </div>
                    <div>
                      <p className={`font-bold ${portal.textH}`}>{a.clients.name}</p>
                      <p className={`text-xs ${portal.textMuted}`}>{a.clients.email}</p>
                      <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                        Session {a.session_number} of {sessionsTotal(a.clients)}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${slotBadge(a.slotStatus)}`}>
                    {a.slotStatus}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/nutritionist/clients/${a.clients.id}`}
                    className={`inline-flex items-center justify-center ${portal.btnOutline}`}
                  >
                    View client profile
                  </Link>
                  {a.status === 'confirmed' && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setCompleteTarget(a)}
                      className={`inline-flex items-center justify-center ${portal.btnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      Complete
                    </button>
                  )}
                  {a.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">
                      <CheckCircle size={16} />
                      Completed
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className={`mb-4 text-lg font-black ${portal.textH}`}>Upcoming (next 7 days)</h2>
        {upcomingSevenDays.length === 0 ? (
          <p className={`text-sm ${portal.textMuted}`}>No upcoming sessions in the next week.</p>
        ) : (
          <ul className={`divide-y ${portal.divider} ${portal.card}`}>
            {upcomingSevenDays.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className={portal.textMuted} size={16} />
                  <span className={portal.textH}>
                    {formatDateShort(row.scheduled_date)} · {formatTime(row.scheduled_time)}
                  </span>
                  <span className={portal.textMuted}>{row.clientName}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Session {row.session_number}
                  </span>
                </div>
                <Link
                  href={`/nutritionist/clients/${row.clientId}`}
                  className={`inline-flex items-center gap-1 text-xs font-bold ${portal.textAccent} hover:underline`}
                >
                  View profile
                  <ChevronRight size={14} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
