'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { type PaidReportSummary } from '@/lib/booking-actions'
import { parseDeficiencySummaryPayload, type DeficiencyItem } from '@/lib/deficiency-profile-parse'
import {
  displayReportStatus,
  formatReportHeadingDate,
  isReportReady,
  reportStatusBadgeClass,
  severityBadgeLight,
} from './profile-helpers'

type Props = {
  paidReports: PaidReportSummary[]
  assessmentDates: Record<string, string>
  expandedReport: string | null
  setExpandedReport: (id: string | null) => void
}

export function MyReportsSection({
  paidReports,
  assessmentDates,
  expandedReport,
  setExpandedReport,
}: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-stone-900">My Reports</h2>

      {paidReports.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
          <p className="text-stone-600">Get your personalized nutrition report</p>
          <Link
            href="/assessment"
            className="mt-6 inline-flex rounded-xl bg-[#1a472a] px-6 py-3 text-sm font-bold text-white"
          >
            Take Free Assessment
          </Link>
        </div>
      ) : (
        paidReports.map((r) => {
          const expanded = expandedReport === r.report_id
          const parsed = parseDeficiencySummaryPayload(r.deficiency_summary)
          const assessDate = r.assessment_id ? assessmentDates[r.assessment_id] : null
          const ready = isReportReady(r.status)
          const badgeLabel = displayReportStatus(r.status)
          return (
            <div
              key={r.report_id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setExpandedReport(expanded ? null : r.report_id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-stone-50"
              >
                <div>
                  <p className="font-bold text-stone-900">
                    Report · {formatReportHeadingDate(r.created_at)}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Assessment:{' '}
                    {assessDate
                      ? new Date(assessDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${reportStatusBadgeClass(r.status)}`}
                  >
                    {badgeLabel}
                  </span>
                </div>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-stone-400 transition ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
              <div className="flex flex-wrap gap-2 border-t border-stone-100 px-5 py-3">
                {ready && (
                  <a
                    href={`/api/download-report?reportId=${encodeURIComponent(r.report_id)}&disposition=attachment`}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Download PDF
                  </a>
                )}
                <Link
                  href={`/report/${encodeURIComponent(r.report_id)}`}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-bold text-stone-800 hover:bg-stone-50"
                >
                  View Report
                </Link>
              </div>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-stone-100 bg-stone-50/80 px-5 py-4"
                  >
                    <p className="text-xs font-bold uppercase text-stone-500">Deficiency summary</p>
                    {parsed.deficiencies.length ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {parsed.deficiencies.map((d: DeficiencyItem) => (
                          <div
                            key={d.nutrient}
                            className="rounded-xl border border-stone-100 bg-white p-3"
                          >
                            <div className="flex justify-between gap-2">
                              <span className="text-sm font-bold">{d.nutrient}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${severityBadgeLight(d.severity)}`}
                              >
                                {d.severity}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-stone-600">{d.reason}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-stone-500">
                        No deficiency snapshot for this report.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })
      )}
    </section>
  )
}
