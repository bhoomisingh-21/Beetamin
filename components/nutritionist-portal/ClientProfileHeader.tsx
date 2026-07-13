'use client'

import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { formatHeight, shortClientId } from '@/lib/meal-plan-meta'
import { buildHraFormDefaults } from '@/lib/nutritionist-hra-defaults'
import type { PortalClientBundle } from '@/lib/nutritionist-types'
import { portal } from '@/components/nutritionist-portal/portal-theme'

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-[72px] flex-col border-r border-emerald-200/80 px-3 py-2 last:border-r-0 sm:min-w-[88px] sm:px-4">
      <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-700/70 sm:text-[10px]">
        {label}
      </span>
      <span className="mt-0.5 truncate text-xs font-semibold text-slate-800 sm:text-sm" title={value}>
        {value}
      </span>
    </div>
  )
}

export function ClientProfileHeader({
  bundle,
  clientId,
  onEditHra,
}: {
  bundle: PortalClientBundle
  clientId: string
  onEditHra?: () => void
}) {
  const { client, progressLogs } = bundle
  const hra = buildHraFormDefaults(bundle)
  const latestWeight = progressLogs.find((l) => l.weight_kg != null)?.weight_kg
  const weight =
    hra.actual_weight_kg != null
      ? `${hra.actual_weight_kg} kg`
      : latestWeight != null
        ? `${Number(latestWeight).toFixed(1)} kg`
        : '—'
  const height = hra.height_cm ?? client.height_cm ?? progressLogs.find((l) => l.height_cm != null)?.height_cm

  const ageGender = [hra.age ? `${hra.age} yrs` : null, hra.gender || null].filter(Boolean).join(', ')

  return (
    <div className={portal.clientHeader}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 px-3 py-2 sm:px-4">
        <Link
          href="/nutritionist/clients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
        >
          <ArrowLeft size={14} aria-hidden />
          All clients
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">
          Client ID: {shortClientId(clientId)}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-3 sm:px-4 sm:py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-black text-emerald-900 sm:text-xl">{client.name}</h1>
            {onEditHra ? (
              <button
                type="button"
                onClick={onEditHra}
                className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
                title="Edit HRA form"
                aria-label="Edit HRA form"
              >
                <Pencil size={14} />
              </button>
            ) : null}
          </div>
          {ageGender ? (
            <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">{ageGender}</p>
          ) : null}
          <span
            className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
              client.status === 'active'
                ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                : client.status === 'expired'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {client.status}
          </span>
        </div>

        <div className="text-right text-xs text-slate-500">
          <p>
            Sessions{' '}
            <span className="font-bold text-emerald-700">
              {client.sessions_used}/{client.sessions_total}
            </span>
          </p>
          <p className="mt-0.5">Goal: {hra.goal || client.assessment_goal || '—'}</p>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-emerald-200/80">
        <div className="flex min-w-max">
          <MetricCell label="Weight" value={weight} />
          <MetricCell label="Height" value={formatHeight(height)} />
          <MetricCell label="Activity" value={hra.activity_level || '—'} />
          <MetricCell label="Goal" value={hra.goal || client.assessment_goal || '—'} />
          <MetricCell label="Food Pref." value={hra.food_preference || '—'} />
          <MetricCell label="Country" value={hra.country || 'India'} />
          <MetricCell label="Community" value={hra.community || '—'} />
          <MetricCell label="Allergies" value={hra.allergies || '—'} />
          <MetricCell label="Lifestyle" value={hra.diseases && hra.diseases !== 'None' ? hra.diseases : '—'} />
        </div>
      </div>
    </div>
  )
}
