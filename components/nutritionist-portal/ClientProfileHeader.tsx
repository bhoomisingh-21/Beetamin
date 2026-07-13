'use client'

import Link from 'next/link'
import { ArrowLeft, Activity, Heart, Pencil, Target, Utensils } from 'lucide-react'
import { formatHeight } from '@/lib/meal-plan-meta'
import { buildHraFormDefaults } from '@/lib/nutritionist-hra-defaults'
import type { PortalClientBundle } from '@/lib/nutritionist-types'
import { avatarPaletteFromName } from '@/lib/nutritionist-utils'
import { portal } from '@/components/nutritionist-portal/portal-theme'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatGoal(goal: string) {
  return goal
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function SessionDots({ used, total }: { used: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${used} of ${total} sessions`}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const done = n <= used
        return (
          <span
            key={n}
            className={`h-2 w-2 rounded-full ${done ? 'bg-emerald-500' : 'border border-emerald-300 bg-white'}`}
          />
        )
      })}
    </div>
  )
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 rounded-xl border border-emerald-200/80 bg-white px-3.5 py-2.5 shadow-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
        <Icon size={12} aria-hidden />
        {label}
      </div>
      <p className="mt-0.5 truncate text-sm font-semibold text-slate-800" title={value}>
        {value}
      </p>
    </div>
  )
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

  const goal = formatGoal(hra.goal || client.assessment_goal || 'Not set')
  const food = hra.food_preference || 'Not set'
  const body =
    [
      hra.actual_weight_kg != null ? `${hra.actual_weight_kg} kg` : null,
      hra.height_cm != null ? formatHeight(hra.height_cm) : null,
    ]
      .filter(Boolean)
      .join(' · ') || 'Not recorded'
  const lifestyle =
    hra.diseases && hra.diseases !== 'None' && hra.diseases !== '' ? hra.diseases : 'None'

  return (
    <header className={portal.clientHeader}>
      <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
        <div className="flex flex-wrap items-start gap-4">
          <Link
            href="/nutritionist/clients"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-800"
          >
            <ArrowLeft size={16} aria-hidden />
            <span className="hidden sm:inline">Clients</span>
          </Link>

          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white shadow-md"
            style={{ backgroundColor: avatarPaletteFromName(client.name) }}
          >
            {initials(client.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">{client.name}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  client.status === 'active'
                    ? 'bg-emerald-600 text-white'
                    : client.status === 'expired'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-200 text-slate-700'
                }`}
              >
                {client.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <SessionDots used={client.sessions_used} total={client.sessions_total} />
              <span className="text-sm font-semibold text-slate-600">
                {client.sessions_used}/{client.sessions_total} sessions
              </span>
            </div>
          </div>

          {onEditHra ? (
            <button
              type="button"
              onClick={onEditHra}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500"
            >
              <Pencil size={15} aria-hidden />
              Edit HRA
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <InfoChip icon={Target} label="Goal" value={goal} />
          <InfoChip icon={Utensils} label="Food pref" value={food} />
          <InfoChip icon={Activity} label="Body" value={body} />
          <InfoChip icon={Heart} label="Lifestyle" value={lifestyle} />
        </div>
      </div>
    </header>
  )
}
