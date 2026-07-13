'use client'

import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { buildHraFormDefaults } from '@/lib/nutritionist-hra-defaults'
import type { PortalClientBundle } from '@/lib/nutritionist-types'
import { avatarPaletteFromName } from '@/lib/nutritionist-utils'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ClientProfileHeader({
  bundle,
  onEditHra,
}: {
  bundle: PortalClientBundle
  onEditHra?: () => void
}) {
  const { client } = bundle
  const hra = buildHraFormDefaults(bundle)
  const goal = hra.goal || client.assessment_goal || 'No goal set'
  const food = hra.food_preference || '—'
  const lifestyle =
    hra.diseases && hra.diseases !== 'None' && hra.diseases !== '' ? hra.diseases : null

  const metaParts = [
    `Session ${client.sessions_used}/${client.sessions_total}`,
    goal,
    food,
    lifestyle,
  ].filter(Boolean)

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link
          href="/nutritionist/clients"
          className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700"
          aria-label="All clients"
        >
          <ArrowLeft size={18} />
        </Link>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: avatarPaletteFromName(client.name) }}
        >
          {initials(client.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-bold text-slate-900">{client.name}</h1>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                client.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : client.status === 'expired'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {client.status}
            </span>
          </div>
          <p className="truncate text-xs text-slate-500" title={metaParts.join(' · ')}>
            {metaParts.join(' · ')}
          </p>
        </div>

        {onEditHra ? (
          <button
            type="button"
            onClick={onEditHra}
            className="shrink-0 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <span className="hidden sm:inline">Edit profile</span>
            <Pencil size={14} className="sm:hidden" aria-hidden />
          </button>
        ) : null}
      </div>
    </header>
  )
}
