'use client'

import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { formatHeight, shortClientId } from '@/lib/meal-plan-meta'
import type { PortalClientBundle } from '@/lib/nutritionist-types'
import { portal } from '@/components/nutritionist-portal/portal-theme'

function extractMeta(client: PortalClientBundle['client']) {
  const meta =
    client.assessment_meta && typeof client.assessment_meta === 'object' && !Array.isArray(client.assessment_meta)
      ? (client.assessment_meta as Record<string, unknown>)
      : null
  const result =
    client.assessment_result &&
    typeof client.assessment_result === 'object' &&
    !Array.isArray(client.assessment_result)
      ? (client.assessment_result as Record<string, unknown>)
      : null

  const activity =
    (typeof meta?.activity === 'string' && meta.activity) ||
    (typeof meta?.activityLevel === 'string' && meta.activityLevel) ||
    (typeof result?.activityLevel === 'string' && result.activityLevel) ||
    '—'

  const diet =
    (typeof result?.diet === 'string' && result.diet) ||
    (typeof result?.dietSummary === 'string' && result.dietSummary) ||
    '—'

  return { activity, diet }
}

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
}: {
  bundle: PortalClientBundle
  clientId: string
}) {
  const { client, progressLogs, detailedAssessment } = bundle
  const latestWeight = progressLogs.find((l) => l.weight_kg != null)?.weight_kg
  const height =
    client.height_cm ?? progressLogs.find((l) => l.height_cm != null)?.height_cm ?? null
  const { activity, diet } = extractMeta(client)

  const foodPref = detailedAssessment?.diet_type || diet

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
            <button
              type="button"
              className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
              title="Edit profile (Overview tab)"
              aria-label="Edit profile"
            >
              <Pencil size={14} />
            </button>
          </div>
          <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
            {client.email}
            {client.phone ? ` · ${client.phone}` : ''}
          </p>
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
          <p className="mt-0.5">Goal: {client.assessment_goal || '—'}</p>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-emerald-200/80">
        <div className="flex min-w-max">
          <MetricCell
            label="Weight"
            value={latestWeight != null ? `${Number(latestWeight).toFixed(1)} kg` : '—'}
          />
          <MetricCell label="Height" value={formatHeight(height)} />
          <MetricCell label="Activity" value={activity} />
          <MetricCell label="Goal" value={client.assessment_goal || '—'} />
          <MetricCell label="Food Pref." value={foodPref} />
          <MetricCell label="Country" value="India" />
          <MetricCell label="Plan ends" value={new Date(client.plan_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
        </div>
      </div>
    </div>
  )
}
