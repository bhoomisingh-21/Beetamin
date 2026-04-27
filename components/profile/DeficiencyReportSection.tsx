'use client'

import Link from 'next/link'
import { FlaskConical } from 'lucide-react'
import { type PaidReportSummary } from '@/lib/booking-actions'
import { parseDeficiencySummaryPayload, type DeficiencyItem } from '@/lib/deficiency-profile-parse'
import {
  deficiencyScorePresentation,
  heading,
  subheading,
} from './profile-dark-styles'
import { formatReportHeadingDate } from './profile-helpers'

function isReadyStatus(s: string) {
  return s === 'ready' || s === 'generated'
}

function severitySolidBadge(sev: string) {
  if (sev === 'high') return 'bg-red-500 text-white'
  if (sev === 'medium') return 'bg-amber-400 text-black'
  return 'bg-emerald-500 text-black'
}

function severityLabel(sev: string) {
  if (sev === 'high') return 'High'
  if (sev === 'medium') return 'Medium'
  return 'Low'
}

type Props = {
  paidReports: PaidReportSummary[]
  /** When false, omit the built-in title block (page supplies its own). */
  showHeading?: boolean
}

export function DeficiencyReportSection({
  paidReports,
  showHeading = true,
}: Props) {
  const latestReady = paidReports.find((r) => isReadyStatus(r.status))

  const parsed = latestReady
    ? parseDeficiencySummaryPayload(latestReady.deficiency_summary)
    : null

  const score =
    parsed?.overallScore != null && !Number.isNaN(Number(parsed.overallScore))
      ? Math.round(Number(parsed.overallScore))
      : null

  const presentation = score != null ? deficiencyScorePresentation(score) : null
  const urgency = parsed?.urgencyMessage?.trim() ?? null

  return (
    <section className="space-y-8">
      {showHeading && (
        <div>
          <h2 className={heading}>Deficiency Profile</h2>
          <p className={subheading}>Based on your latest paid report</p>
        </div>
      )}

      {!latestReady ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#111820]/80 px-6 py-14 text-center">
          <FlaskConical className="mx-auto h-14 w-14 text-emerald-500/90" strokeWidth={1.25} aria-hidden />
          <p className="mt-6 text-lg font-bold text-white">No deficiency data yet</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-400">
            Your profile will appear here after your paid report.
          </p>
          <Link
            href="/assessment"
            className="mt-8 inline-flex rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-black hover:bg-emerald-400"
          >
            Get My Report
          </Link>
        </div>
      ) : (
        <>
          {score != null && presentation && (
            <div
              className={`flex flex-col gap-6 rounded-2xl border border-white/[0.08] bg-gradient-to-br p-6 md:flex-row md:items-center md:justify-between md:p-8 ${presentation.barClass}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-end gap-2">
                  <span className={`text-5xl font-black tabular-nums leading-none ${presentation.textClass}`}>
                    {score}
                  </span>
                  <span className="pb-1 text-2xl font-semibold text-gray-500">/100</span>
                  <span
                    className={`mb-1 ml-2 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${presentation.textClass} ring-1 ring-white/15`}
                  >
                    {presentation.label}
                  </span>
                </div>
                {latestReady.created_at && (
                  <p className="mt-3 text-xs text-gray-500">
                    From report on {formatReportHeadingDate(latestReady.created_at)}
                  </p>
                )}
              </div>
              {urgency ? (
                <p className="max-w-xl flex-1 text-right text-sm leading-relaxed text-gray-200 md:text-base">
                  {urgency}
                </p>
              ) : null}
            </div>
          )}

          {latestReady.created_at && (score == null || !presentation) && (
            <p className="text-sm text-gray-500">
              From report on {formatReportHeadingDate(latestReady.created_at)}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {(parsed?.deficiencies ?? []).map((def: DeficiencyItem, i: number) => (
              <div
                key={`${def.nutrient}-${i}`}
                className="relative rounded-2xl border border-white/[0.08] bg-[#111820] p-5 md:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="pr-2 text-xl font-black leading-tight text-white">{def.nutrient}</h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${severitySolidBadge(def.severity)}`}
                  >
                    {severityLabel(def.severity)}
                  </span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-gray-400">{def.reason}</p>
                {def.symptoms.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {def.symptoms.map((s: string, j: number) => (
                      <span
                        key={j}
                        className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-gray-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
