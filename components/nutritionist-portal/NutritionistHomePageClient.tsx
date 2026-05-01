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
    Upcoming: 'border-white/15 bg-white/5 text-[#8B9AB0]',
    'In Progress': 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400',
    Completed: 'border-emerald-500/35 bg-emerald-500/12 text-emerald-400',
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

      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-4">
        <Link
          href="/nutritionist-dashboard"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#8B9AB0] transition hover:bg-white/[0.04] hover:text-emerald-400"
        >
          <ChevronLeft size={18} aria-hidden />
          Back to quick dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#F0F4F8]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#8B9AB0]">Sessions and clients at a glance</p>
        <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/[0.06] bg-[#0F1623] px-4 py-5 shadow-[0_0_0_1px_rgba(16,185,129,0.05),0_4px_24px_rgba(0,0,0,0.4)]"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B9AB0]">{s.label}</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-emerald-400">{s.value}</p>
          </div>
        ))}
      </div>

      {pendingRequests.length > 0 && (
        <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5">
          <h2 className="flex items-center gap-2 text-sm font-black text-amber-300">
            <ClipboardList size={18} />
            Pending confirmations ({pendingRequests.length})
          </h2>
          <ul className="mt-4 space-y-3">
            {pendingRequests.slice(0, 8).map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0F1623] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-black text-white"
                    style={{ backgroundColor: avatarColor(a.clients.name) }}
                  >
                    {initials(a.clients.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#F0F4F8]">{a.clients.name}</p>
                    <p className="text-xs text-[#8B9AB0]">
                      {formatDateShort(a.scheduled_date)} · {formatTime(a.scheduled_time)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => quickConfirm(a.id)}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
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
          <h2 className="text-lg font-black text-[#F0F4F8]">Today&apos;s sessions</h2>
          <div className="flex items-center gap-3">
            {pending && <Loader2 className="animate-spin text-emerald-500" size={18} />}
            <Link
              href="/nutritionist/appointments"
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              All appointments →
            </Link>
          </div>
        </div>

        {todaySessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#0F1623]/60 px-6 py-14 text-center">
            <Calendar className="mx-auto text-[#8B9AB0]" size={36} />
            <p className="mt-4 font-semibold text-[#F0F4F8]">No sessions scheduled for today</p>
            <p className="mt-1 text-sm text-[#8B9AB0]">Confirmed or pending requests will show here.</p>
            <Link
              href="/nutritionist/clients"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/35 px-5 py-3 text-sm font-bold text-emerald-400 hover:bg-emerald-500/10"
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
                className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#0F1623] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.35)] md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-1 flex-wrap items-center gap-4">
                  <div className="text-lg font-black tabular-nums text-emerald-400">{formatTime(a.scheduled_time)}</div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white"
                      style={{ backgroundColor: avatarColor(a.clients.name) }}
                    >
                      {initials(a.clients.name)}
                    </div>
                    <div>
                      <p className="font-bold text-[#F0F4F8]">{a.clients.name}</p>
                      <p className="text-xs text-[#8B9AB0]">{a.clients.email}</p>
                      <p className="mt-1 text-[11px] font-semibold text-emerald-400/90">
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
                    className="inline-flex items-center justify-center rounded-xl border border-emerald-500/35 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500/10"
                  >
                    View client profile
                  </Link>
                  {a.status === 'confirmed' && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setCompleteTarget(a)}
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Complete
                    </button>
                  )}
                  {a.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/35 bg-emerald-500/12 px-4 py-2.5 text-sm font-bold text-emerald-400">
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
        <h2 className="mb-4 text-lg font-black text-[#F0F4F8]">Upcoming (next 7 days)</h2>
        {upcomingSevenDays.length === 0 ? (
          <p className="text-sm text-[#8B9AB0]">No upcoming sessions in the next week.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-[#0F1623]">
            {upcomingSevenDays.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="text-[#8B9AB0]" size={16} />
                  <span className="text-[#F0F4F8]">
                    {formatDateShort(row.scheduled_date)} · {formatTime(row.scheduled_time)}
                  </span>
                  <span className="text-[#8B9AB0]">{row.clientName}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Session {row.session_number}
                  </span>
                </div>
                <Link
                  href={`/nutritionist/clients/${row.clientId}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline"
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
