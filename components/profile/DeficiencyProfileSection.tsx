'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { type PaidReportSummary } from '@/lib/booking-actions'
import { parseDeficiencySummaryPayload, type DeficiencyItem } from '@/lib/deficiency-profile-parse'
import { formatReportHeadingDate, severityBadgeAssessmentStyle } from './profile-helpers'

type Props = {
  paidReports: PaidReportSummary[]
}

export function DeficiencyProfileSection({ paidReports }: Props) {
  const latestReady = paidReports.find((r) => r.status === 'ready' || r.status === 'generated')

  const deficiencySource =
    latestReady != null
      ? {
          report: latestReady,
          parsed: parseDeficiencySummaryPayload(latestReady.deficiency_summary),
        }
      : null

  const reportDateSubtitle = deficiencySource?.report.created_at
    ? formatReportHeadingDate(deficiencySource.report.created_at)
    : null

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-bold text-stone-900">Deficiency Profile</h2>

      {!deficiencySource ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
          <p className="text-stone-600">
            Your deficiency profile appears here after you get your paid report
          </p>
          <Link
            href="/assessment"
            className="mt-6 inline-flex rounded-xl bg-[#1a472a] px-6 py-3 text-sm font-bold text-white"
          >
            Get Assessment Report
          </Link>
        </div>
      ) : (
        <>
          {reportDateSubtitle && (
            <p className="text-sm text-stone-500">
              From your report on {reportDateSubtitle}
            </p>
          )}
          {deficiencySource.parsed.overallScore != null && (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Overall deficiency score
              </p>
              <p className="mt-2 text-4xl font-black text-[#1a472a]">
                {Math.round(deficiencySource.parsed.overallScore)}
                <span className="text-lg text-stone-400">/100</span>
              </p>
            </div>
          )}
          <div className="space-y-3">
            {deficiencySource.parsed.deficiencies.map((def: DeficiencyItem, i: number) => (
              <motion.div
                key={`${def.nutrient}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-bold leading-snug text-stone-900">{def.nutrient}</p>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${severityBadgeAssessmentStyle(def.severity)}`}
                  >
                    {def.severity} risk
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{def.reason}</p>
                {def.symptoms.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {def.symptoms.map((s: string, j: number) => (
                      <span
                        key={j}
                        className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          {!deficiencySource.parsed.deficiencies.length && (
            <p className="text-sm text-stone-500">No deficiency rows stored for this report.</p>
          )}
        </>
      )}
    </section>
  )
}
