'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ClientRow } from '@/lib/booking-types'
import type { PortalClientListRow, SessionDotState } from '@/lib/nutritionist-types'
import { avatarPaletteFromName } from '@/lib/nutritionist-utils'
import { Search, UserPlus } from 'lucide-react'
import { AddClientModal } from '@/components/nutritionist-portal/AddClientModal'
import { portal } from '@/components/nutritionist-portal/portal-theme'

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
        let cls = 'h-2 w-2 shrink-0 rounded-full border border-slate-300 bg-transparent'
        if (s === 'completed') cls = 'h-2 w-2 shrink-0 rounded-full bg-emerald-500'
        else if (s === 'confirmed' || s === 'pending') cls = 'h-2 w-2 shrink-0 rounded-full bg-blue-500'
        return <span key={n} className={cls} />
      })}
    </div>
  )
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    expired: 'border-red-300 bg-red-50 text-red-700',
    completed: 'border-blue-300 bg-blue-50 text-blue-700',
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
  const [addOpen, setAddOpen] = useState(false)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return clients.filter((c) => {
      if (filter !== 'all' && c.status !== filter) return false
      if (!needle) return true
      return c.name.toLowerCase().includes(needle)
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
      <div>
        <h1 className={portal.heading}>My Clients</h1>
        <p className={portal.subtext}>Clients you have sessions with — search and filter by status</p>
        <div className={portal.accentBar} aria-hidden />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${portal.textMuted}`} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name…"
            className={portal.inputSearch}
          />
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500"
        >
          <UserPlus size={16} />
          Add client
        </button>
        <div className="flex flex-wrap gap-2 sm:order-last sm:w-full lg:w-auto lg:order-none">
          {pills.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setFilter(p.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === p.key
                  ? portal.tabActive
                  : portal.tabIdle
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={portal.cardEmpty}>
          <p className={`font-semibold ${portal.textH}`}>No clients match</p>
          <p className={`mt-2 text-sm ${portal.textMuted}`}>Try another search or filter.</p>
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
                className={`flex flex-col gap-5 ${portal.card} p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8`}
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
                    <p className={`text-base font-bold ${portal.textH}`}>{c.name}</p>
                    {c.assessment_goal ? (
                      <p className={`mt-1 text-[13px] ${portal.textMuted}`}>{c.assessment_goal}</p>
                    ) : null}
                  </div>
                </div>

                {/* Center */}
                <div className={`min-w-0 flex-1 space-y-3 border-y ${portal.divider} py-5 lg:border-x lg:border-y-0 lg:px-8 lg:py-0`}>
                  {c.assessment_goal ? (
                    <span className="inline-block rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      {c.assessment_goal}
                    </span>
                  ) : (
                    <span className={`text-xs ${portal.textMuted}`}>No goal on file</span>
                  )}
                  <SessionDotsRow states={c.sessionStates} />
                  <p className={`text-[13px] ${portal.textMuted}`}>
                    Session{' '}
                    <span className={`font-bold ${portal.textH}`}>
                      {sessionLabelNum} of {total}
                    </span>
                  </p>
                  <p className={`text-[13px] ${portal.textMuted}`}>
                    Plan expires: <span className={portal.textH}>{formatPlanDate(c.plan_end_date)}</span>
                  </p>
                </div>

                {/* Right */}
                <div className="flex shrink-0 flex-col items-stretch gap-3 lg:w-[200px] lg:items-end">
                  <span className={`self-start rounded-full border px-3 py-1 text-[11px] font-bold lg:self-end ${statusBadge(c.status)}`}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                  <p className={`text-sm lg:text-right ${portal.textMuted}`}>
                    <span className={`font-semibold ${portal.textH}`}>{c.sessions_remaining}</span> sessions left
                  </p>
                  <Link
                    href={`/nutritionist/clients/${c.id}`}
                    className={`rounded-xl px-4 py-2.5 text-center text-sm font-bold lg:w-full ${portal.btnOutline}`}
                  >
                    View Profile →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddClientModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
