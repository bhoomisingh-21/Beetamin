'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ClientRow } from '@/lib/booking-actions'
import type { PortalClientListRow, SessionDotState } from '@/lib/nutritionist-types'
import { avatarPaletteFromName } from '@/lib/nutritionist-utils'
import { Search, ChevronLeft } from 'lucide-react'

const backBtn =
  'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0F1623]/60 px-4 py-2 text-sm font-semibold text-[#8B9AB0] transition hover:border-emerald-500/25 hover:text-emerald-400'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function SessionDotsRow({ states }: { states?: Partial<Record<number, SessionDotState>> }) {
  return (
    <div className="flex gap-1.5 pt-1" aria-hidden>
      {[1, 2, 3, 4, 5, 6].map((n) => {
        const s = states?.[n]
        let cls = 'h-2 w-2 shrink-0 rounded-full border border-white/20 bg-transparent'
        if (s === 'completed') cls = 'h-2 w-2 shrink-0 rounded-full bg-emerald-500'
        else if (s === 'confirmed' || s === 'pending') cls = 'h-2 w-2 shrink-0 rounded-full bg-blue-500'
        return <span key={n} className={cls} />
      })}
    </div>
  )
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400',
    expired: 'border-red-500/35 bg-red-500/10 text-red-400',
    completed: 'border-blue-500/35 bg-blue-500/10 text-blue-300',
  }
  return map[status] || map.completed
}

function formatPlanDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

type FilterKey = 'all' | ClientRow['status']

export default function NutritionistClientsPageClient({ clients }: { clients: PortalClientListRow[] }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return clients.filter((c) => {
      if (filter !== 'all' && c.status !== filter) return false
      if (!needle) return true
      return (
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        (c.phone || '').toLowerCase().includes(needle)
      )
    })
  }, [clients, q, filter])

  const pills: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'expired', label: 'Expired' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Link href="/nutritionist" className={backBtn}>
          <ChevronLeft size={18} aria-hidden />
          Portal home
        </Link>
        <Link href="/nutritionist-dashboard" className={backBtn}>
          <ChevronLeft size={18} aria-hidden />
          Quick dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#F0F4F8]">All Clients</h1>
        <p className="mt-1 text-sm text-[#8B9AB0]">Everyone on file — search and filter by status</p>
        <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B9AB0]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-xl border border-white/[0.08] bg-[#0F1623] py-2.5 pl-10 pr-4 text-sm text-[#F0F4F8] outline-none ring-emerald-500/20 focus:ring-2"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {pills.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setFilter(p.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === p.key
                  ? 'bg-emerald-500 text-black'
                  : 'border border-white/[0.08] bg-[#0F1623] text-[#8B9AB0] hover:border-emerald-500/25'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#0F1623]/50 px-6 py-16 text-center">
          <p className="font-semibold text-[#F0F4F8]">No clients match</p>
          <p className="mt-2 text-sm text-[#8B9AB0]">Try another search or filter.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((c) => {
            const total = Math.max(1, c.sessions_total || c.sessions_used + c.sessions_remaining)
            const sessionLabelNum =
              c.status === 'active' && c.sessions_remaining > 0
                ? Math.min(total, c.sessions_used + 1)
                : Math.min(total, c.sessions_used)
            return (
              <div
                key={c.id}
                className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#0F1623] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.35)] lg:flex-row lg:items-center lg:justify-between lg:gap-8"
              >
                {/* Left */}
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                    style={{ backgroundColor: avatarPaletteFromName(c.name) }}
                  >
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#F0F4F8]">{c.name}</p>
                    <p className="text-[13px] text-[#8B9AB0]">{c.email}</p>
                    {c.phone ? <p className="text-[13px] text-[#8B9AB0]">{c.phone}</p> : null}
                  </div>
                </div>

                {/* Center */}
                <div className="min-w-0 flex-1 space-y-3 border-y border-white/[0.06] py-5 lg:border-x lg:border-y-0 lg:px-8 lg:py-0">
                  {c.assessment_goal ? (
                    <span className="inline-block rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                      {c.assessment_goal}
                    </span>
                  ) : (
                    <span className="text-xs text-[#8B9AB0]">No goal on file</span>
                  )}
                  <SessionDotsRow states={c.sessionStates} />
                  <p className="text-[13px] text-[#8B9AB0]">
                    Session{' '}
                    <span className="font-bold text-[#F0F4F8]">
                      {sessionLabelNum} of {total}
                    </span>
                  </p>
                  <p className="text-[13px] text-[#8B9AB0]">
                    Plan expires: <span className="text-[#F0F4F8]">{formatPlanDate(c.plan_end_date)}</span>
                  </p>
                </div>

                {/* Right */}
                <div className="flex shrink-0 flex-col items-stretch gap-3 lg:w-[200px] lg:items-end">
                  <span className={`self-start rounded-full border px-3 py-1 text-[11px] font-bold lg:self-end ${statusBadge(c.status)}`}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                  <p className="text-sm text-[#8B9AB0] lg:text-right">
                    <span className="font-semibold text-[#F0F4F8]">{c.sessions_remaining}</span> sessions left
                  </p>
                  <Link
                    href={`/nutritionist/clients/${c.id}`}
                    className="rounded-xl border border-emerald-500/40 px-4 py-2.5 text-center text-sm font-bold text-emerald-400 hover:bg-emerald-500/10 lg:w-full"
                  >
                    View Profile →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
