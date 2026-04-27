'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Loader2 } from 'lucide-react'
import { type PaidReportSummary } from '@/lib/booking-actions'
import { parseDeficiencySummaryPayload, type DeficiencyItem } from '@/lib/deficiency-profile-parse'
import { darkCard, heading, subheading } from './profile-dark-styles'
import { displayReportStatus, formatReportHeadingDate, isReportReady } from './profile-helpers'

function statusBadgeDark(status: string): string {
  const d = displayReportStatus(status)
  if (d === 'ready')
    return 'border-emerald-500/35 bg-emerald-500/15 text-emerald-400'
  if (d === 'generating')
    return 'border-blue-500/35 bg-blue-500/15 text-blue-300'
  if (d === 'failed') return 'border-red-500/35 bg-red-500/15 text-red-400'
  return 'border-white/15 bg-white/5 text-gray-400'
}

function severityDotClass(sev: string) {
  if (sev === 'high') return 'bg-red-500'
  if (sev === 'medium') return 'bg-amber-400'
  return 'bg-emerald-400'
}

type Props = {
  paidReports: PaidReportSummary[]
  assessmentDates: Record<string, string>
  expandedReport: string | null
  setExpandedReport: (id: string | null) => void
  showHeading?: boolean
}

export function AssessmentHistorySection({
  paidReports,
  assessmentDates,
  expandedReport,
  setExpandedReport,
  showHeading = true,
}: Props) {
  return (
    <section className="space-y-6">
      {showHeading && (
        <div>
          <h2 className={heading}>My Reports</h2>
          <p className={subheading}>All your assessments and paid reports</p>
        </div>
      )}

      {paidReports.length === 0 ? (
        <div className={`${darkCard} border-dashed border-white/15 text-center`}>
          <div className="text-5xl" aria-hidden>
            📋
          </div>
          <p className="mt-4 text-lg font-bold text-white">No reports yet</p>
          <p className="mt-2 text-sm text-gray-400">
            Take your free assessment to get started.
          </p>
          <Link
            href="/assessment"
            className="mt-6 inline-flex rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-black hover:bg-emerald-400"
          >
            Take Free Assessment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {paidReports.map((r) => {
            const expanded = expandedReport === r.report_id
            const parsed = parseDeficiencySummaryPayload(r.deficiency_summary)
            const assessDate = r.assessment_id ? assessmentDates[r.assessment_id] : null
            const ready = isReportReady(r.status)
            const label = displayReportStatus(r.status)
            const badgeExtra = label === 'generating' ? (
              <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin" />
            ) : null

            return (
              <div
                key={r.report_id}
                className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111820] shadow-sm"
              >
                <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                  <button
                    type="button"
                    onClick={() => setExpandedReport(expanded ? null : r.report_id)}
                    className="flex flex-1 flex-col gap-4 text-left sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white">
                        {formatReportHeadingDate(r.created_at)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Assessment:{' '}
                        {assessDate
                          ? new Date(assessDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                    <div className="flex flex-1 justify-start sm:justify-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${statusBadgeDark(r.status)}`}
                      >
                        {label === 'ready' ? 'Ready' : label === 'failed' ? 'Failed' : 'Generating'}
                        {badgeExtra}
                      </span>
                    </div>
                    <ChevronDown
                      size={22}
                      className={`shrink-0 text-gray-500 transition sm:mt-1 ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <div
                    className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    {ready && (
                      <a
                        href={`/api/download-report?reportId=${encodeURIComponent(r.report_id)}&disposition=attachment`}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-black hover:bg-emerald-400"
                      >
                        Download PDF
                      </a>
                    )}
                    <Link
                      href={`/report/${encodeURIComponent(r.report_id)}`}
                      className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/5"
                    >
                      View Report
                    </Link>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 bg-black/25 px-5 py-4"
                    >
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        Deficiency summary
                      </p>
                      {parsed.deficiencies.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {parsed.deficiencies.map((d: DeficiencyItem, i: number) => (
                            <div
                              key={`${d.nutrient}-${i}`}
                              className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111820]/80 px-3 py-2"
                            >
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${severityDotClass(d.severity)}`}
                                title={d.severity}
                                aria-hidden
                              />
                              <span className="text-sm font-bold text-white">{d.nutrient}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No deficiency snapshot for this report.</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
