'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { ClientRow } from '@/lib/booking-actions'
import type { PortalClientListRow } from '@/lib/nutritionist-types'

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

function SessionDotsRow({ client }: { client: ClientRow }) {
  const total = Math.max(1, client.sessions_total || client.sessions_used + client.sessions_remaining)
  const used = Math.min(client.sessions_used, total)
  return (
    <div className="flex gap-1 pt-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${i < used ? 'bg-emerald-500' : 'border border-white/25 bg-transparent'}`}
        />
      ))}
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

function daysRemaining(planEnd: string): number {
  const end = new Date(planEnd).getTime()
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000))
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
        c.email.toLowerCase().includes(needle)
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
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#F0F4F8]">My clients</h1>
        <p className="mt-1 text-sm text-[#8B9AB0]">Anyone you&apos;ve seen through appointments</p>
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
          <p className="font-semibold text-[#F0F4F8]">No clients yet</p>
          <p className="mt-2 text-sm text-[#8B9AB0]">Clients will appear here after they purchase a plan and book with you.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#0F1623] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.35)] sm:flex-row sm:items-stretch"
            >
              <div className="flex shrink-0 justify-center sm:block">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-black text-white"
                  style={{ backgroundColor: avatarColor(c.name) }}
                >
                  {initials(c.name)}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-[#F0F4F8]">{c.name}</p>
                <p className="truncate text-xs text-[#8B9AB0]">{c.email}</p>
                {c.assessment_goal ? (
                  <span className="mt-2 inline-block rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                    {c.assessment_goal}
                  </span>
                ) : null}
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B9AB0]">Sessions</p>
                  <SessionDotsRow client={c} />
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-stretch justify-between gap-3 border-t border-white/[0.06] pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <span className={`self-start rounded-full border px-3 py-1 text-[11px] font-bold ${statusBadge(c.status)}`}>
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
                <div className="text-right text-xs text-[#8B9AB0]">
                  <p>{c.sessions_remaining} left</p>
                  <p className="mt-1">{daysRemaining(c.plan_end_date)} days in plan</p>
                </div>
                <Link
                  href={`/nutritionist/clients/${c.id}`}
                  className="rounded-xl border border-emerald-500/35 px-4 py-2.5 text-center text-sm font-bold text-emerald-400 hover:bg-emerald-500/10"
                >
                  View profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
