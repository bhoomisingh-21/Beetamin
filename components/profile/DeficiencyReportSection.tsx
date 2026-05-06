'use client'

import Link from 'next/link'
import { FlaskConical, Pill } from 'lucide-react'
import { type PaidReportSummary } from '@/lib/booking-actions'
import { parseDeficiencySummaryPayload, type DeficiencyItem } from '@/lib/deficiency-profile-parse'
import { DeficiencyScoreGauge } from '@/components/profile/DeficiencyScoreGauge'
import {
  deficiencyScorePresentation,
  heading,
  profileCard,
  subheading,
  textSecondary,
} from '@/components/profile/profile-dark-styles'
import { formatReportHeadingDate } from '@/components/profile/profile-helpers'

function severityStripe(sev: string) {
  if (sev === 'high') return { icon: 'bg-red-500/25 text-red-400', badge: 'bg-red-500 text-white' }
  if (sev === 'medium')
    return { icon: 'bg-orange-500/25 text-orange-400', badge: 'bg-orange-500 text-black' }
  return { icon: 'bg-emerald-500/25 text-emerald-400', badge: 'bg-emerald-500 text-black' }
}

function severityLabel(sev: string) {
  if (sev === 'high') return 'High'
  if (sev === 'medium') return 'Medium'
  return 'Low'
}

type Props = {
  paidReports: PaidReportSummary[]
  showHeading?: boolean
}

/** Paid report — status ready or generated (completed) */
export function DeficiencyReportSection({
  paidReports,
  showHeading = true,
}: Props) {
  const latestPaid = paidReports.find(
    (r) => r.status === 'ready' || r.status === 'generated',
  )

  const parsed = latestPaid
    ? parseDeficiencySummaryPayload(latestPaid.deficiency_summary)
    : null

  const score =
    parsed?.overallScore != null && !Number.isNaN(Number(parsed.overallScore))
      ? Math.round(Number(parsed.overallScore))
      : null

  const presentation = score != null ? deficiencyScorePresentation(score) : null
  const urgency = parsed?.urgencyMessage?.trim() ?? null

  if (!latestPaid) return null

  return (
    <section className="space-y-8">
      {showHeading && (
        <div>
          <h2 className={heading}>Deficiency Profile</h2>
          <p className={subheading}>Your paid report snapshot</p>
          <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
        Paid Report
        {latestPaid.created_at ? ` · ${formatReportHeadingDate(latestPaid.created_at)}` : ''}
      </p>

      <>
        {score != null && presentation && (
          <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
            <div
              className={`${profileCard} p-6 lg:col-span-3 lg:p-8 bg-gradient-to-br ${presentation.barClass}`}
            >
              <div className="flex flex-wrap items-end gap-2">
                <span
                  className={`text-7xl font-black tabular-nums leading-none md:text-[80px] ${presentation.textClass}`}
                  style={{ textShadow: `0 0 40px ${presentation.fillHex}44` }}
                >
                  {score}
                </span>
                <span className="pb-2 text-2xl font-semibold text-[#8B9AB0]">/100</span>
              </div>
              <span
                className={`mt-4 inline-flex rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wide ${presentation.textClass} ring-1 ring-white/10`}
              >
                {presentation.label}
              </span>
              {urgency ? (
                <p className="mt-6 text-sm italic leading-relaxed text-[#8B9AB0]">{urgency}</p>
              ) : null}
            </div>

            <div className={`${profileCard} flex flex-col items-center justify-center p-6 lg:col-span-2`}>
              <p className="mb-2 text-[15px] font-semibold text-[#F0F4F8]">Visual score</p>
              <DeficiencyScoreGauge score={score} fill={presentation.fillHex} />
            </div>
          </div>
        )}

        {latestPaid.created_at && (score == null || !presentation) && (
          <p className={`text-sm ${textSecondary}`}>
            From report on {formatReportHeadingDate(latestPaid.created_at)}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {(parsed?.deficiencies ?? []).map((def: DeficiencyItem, i: number) => {
            const stripe = severityStripe(def.severity)
            return (
              <div key={`${def.nutrient}-${i}`} className={`${profileCard} p-5 md:p-6`}>
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${stripe.icon}`}
                  >
                    <Pill className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-bold leading-tight text-[#F0F4F8]">{def.nutrient}</h3>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${stripe.badge}`}
                      >
                        {severityLabel(def.severity)}
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#8B9AB0]">{def.reason}</p>
                    {def.symptoms.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {def.symptoms.map((s: string, j: number) => (
                          <span
                            key={j}
                            className="rounded-full bg-[#1A2332] px-2.5 py-1 text-[11px] text-[#8B9AB0]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Link
          href={`/report/${encodeURIComponent(latestPaid.report_id)}`}
          className="flex w-full items-center justify-center rounded-xl border-2 border-emerald-500/50 bg-transparent py-4 text-sm font-bold text-emerald-400 transition hover:border-emerald-400 hover:bg-emerald-500/10"
        >
          View Entire Result
        </Link>
      </>
    </section>
  )
}

export function DeficiencyEmptyState() {
  return (
    <div
      className={`flex min-h-[280px] flex-col items-center justify-center ${profileCard} border-dashed px-6 py-14 text-center`}
    >
      <FlaskConical className="mx-auto h-14 w-14 text-emerald-500/90" strokeWidth={1.25} aria-hidden />
      <p className="mt-6 text-lg font-bold text-[#F0F4F8]">No deficiency data yet</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#8B9AB0]">
        Take the free assessment to see your profile.
      </p>
      <a
        href="/assessment"
        className="mt-8 inline-flex rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-black hover:bg-emerald-400"
      >
        Take Free Assessment
      </a>
    </div>
  )
}
