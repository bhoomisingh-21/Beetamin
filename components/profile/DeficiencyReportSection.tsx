'use client'

import Link from 'next/link'
import { type PaidReportSummary } from '@/lib/booking-actions'
import { parseDeficiencySummaryPayload, type DeficiencyItem } from '@/lib/deficiency-profile-parse'
import {
  darkCard,
  deficiencyScorePresentation,
  heading,
  severityPillDark,
  subheading,
} from './profile-dark-styles'
import { formatReportHeadingDate } from './profile-helpers'

function isReadyStatus(s: string) {
  return s === 'ready' || s === 'generated'
}

type Props = {
  paidReports: PaidReportSummary[]
}

export function DeficiencyReportSection({ paidReports }: Props) {
  const latestReady = paidReports.find((r) => isReadyStatus(r.status))

  const parsed = latestReady
    ? parseDeficiencySummaryPayload(latestReady.deficiency_summary)
    : null

  const score =
    parsed?.overallScore != null && !Number.isNaN(Number(parsed.overallScore))
      ? Math.round(Number(parsed.overallScore))
      : null

  const presentation = score != null ? deficiencyScorePresentation(score) : null

  return (
    <section className="space-y-6">
      <div>
        <h2 className={heading}>My Deficiency Profile</h2>
        <p className={subheading}>From your latest paid report</p>
      </div>

      {!latestReady ? (
        <div className={`${darkCard} border-dashed border-white/15 bg-[#111820]/80 text-center`}>
          <p className="text-sm leading-relaxed text-gray-400">
            Your deficiency profile will appear here after you receive your paid report.
          </p>
          <Link
            href="/assessment"
            className="mt-6 inline-flex rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-black hover:bg-emerald-400"
          >
            Get My Report
          </Link>
        </div>
      ) : (
        <>
          {score != null && presentation && (
            <div
              className={`rounded-3xl border border-white/[0.08] bg-gradient-to-br ${presentation.barClass} p-8`}
            >
              <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                Overall score
              </p>
              <div className={`mt-3 text-center text-5xl font-black tabular-nums ${presentation.textClass}`}>
                {score}
                <span className="text-2xl font-bold text-gray-500">/100</span>
              </div>
              <p className={`mt-2 text-center text-lg font-bold ${presentation.textClass}`}>
                {presentation.label}
              </p>
              {latestReady.created_at && (
                <p className="mt-2 text-center text-xs text-gray-500">
                  From report on {formatReportHeadingDate(latestReady.created_at)}
                </p>
              )}
            </div>
          )}
          {latestReady.created_at && (score == null || !presentation) && (
            <p className="text-sm text-gray-500">
              From report on {formatReportHeadingDate(latestReady.created_at)}
            </p>
          )}

          <div className="space-y-4">
            {(parsed?.deficiencies ?? []).map((def: DeficiencyItem, i: number) => (
              <div key={`${def.nutrient}-${i}`} className={darkCard}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-lg font-bold text-white">{def.nutrient}</p>
                  <span
                    className={`rounded-full border px-3 py-0.5 text-[10px] font-black uppercase ${severityPillDark(def.severity)}`}
                  >
                    {def.severity}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{def.reason}</p>
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
