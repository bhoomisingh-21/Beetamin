'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, FileText, Loader2 } from 'lucide-react'
import { type PaidReportSummary } from '@/lib/booking-actions'
import { parseDeficiencySummaryPayload, type DeficiencyItem } from '@/lib/deficiency-profile-parse'
import { heading, profileCard, subheading, textSecondary } from '@/components/profile/profile-dark-styles'
import { displayReportStatus, formatReportHeadingDate, isReportReady } from '@/components/profile/profile-helpers'

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

function severityLabel(sev: string) {
  if (sev === 'high') return 'High'
  if (sev === 'medium') return 'Medium'
  return 'Low'
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
    <section className="space-y-8">
      {showHeading && (
        <div>
          <h2 className={heading}>My Reports</h2>
          <p className={subheading}>All your assessments and paid reports</p>
          <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
        </div>
      )}

      {paidReports.length === 0 ? (
        <div
          className={`flex min-h-[280px] flex-col items-center justify-center ${profileCard} border-dashed text-center`}
        >
          <FileText className="mx-auto h-14 w-14 text-[#8B9AB0]" strokeWidth={1.25} aria-hidden />
          <p className="mt-6 text-lg font-bold text-[#F0F4F8]">No reports yet</p>
          <p className={`mt-2 text-sm ${textSecondary}`}>Take your free assessment to get started.</p>
          <Link
            href="/assessment"
            className="mt-8 inline-flex rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-black hover:bg-emerald-400"
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
            const badgeExtra =
              label === 'generating' ? (
                <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : null

            const scoreNum =
              parsed.overallScore != null && !Number.isNaN(Number(parsed.overallScore))
                ? Math.round(Number(parsed.overallScore))
                : null

            const reportTitle = formatReportHeadingDate(r.created_at)
            const defCount = parsed.deficiencies.length

            return (
              <div key={r.report_id} className={`${profileCard} overflow-hidden p-0`}>
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                  <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => setExpandedReport(expanded ? null : r.report_id)}
                      className="flex min-w-0 flex-1 items-start gap-4 text-left"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
                        <FileText className="h-6 w-6" strokeWidth={2} aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#F0F4F8]">Report — {reportTitle}</p>
                        <p className={`mt-1 text-xs ${textSecondary}`}>
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
                    </button>

                    <div className="flex flex-1 flex-col items-start gap-2 sm:items-center lg:mx-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${statusBadgeDark(r.status)}`}
                      >
                        {label === 'ready' ? 'Ready' : label === 'failed' ? 'Failed' : 'Generating'}
                        {badgeExtra}
                      </span>
                      <p className={`text-xs ${textSecondary}`}>
                        {defCount === 1 ? '1 deficiency found' : `${defCount} deficiencies found`}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <Link
                      href={`/report/${encodeURIComponent(r.report_id)}`}
                      className="rounded-xl border border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10"
                    >
                      View Report
                    </Link>
                    {ready && (
                      <a
                        href={`/api/download-report?reportId=${encodeURIComponent(r.report_id)}&disposition=attachment`}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-black hover:bg-emerald-400"
                      >
                        Download PDF
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedReport(expanded ? null : r.report_id)}
                      className="rounded-lg p-2 text-[#8B9AB0] hover:bg-white/5 hover:text-[#F0F4F8]"
                      aria-expanded={expanded}
                      aria-label={expanded ? 'Collapse' : 'Expand'}
                    >
                      <ChevronDown
                        size={22}
                        className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden border-t border-white/[0.06] bg-[#060910]/60"
                    >
                      <div className="px-5 py-5">
                        {scoreNum != null && (
                          <p className="mb-4 text-sm font-bold text-[#F0F4F8]">
                            Overall Score: {scoreNum}/100
                          </p>
                        )}
                        {parsed.deficiencies.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {parsed.deficiencies.map((d: DeficiencyItem, i: number) => (
                              <div
                                key={`${d.nutrient}-${i}`}
                                className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#0F1623] px-3 py-2.5"
                              >
                                <span
                                  className={`h-2 w-2 shrink-0 rounded-full ${severityDotClass(d.severity)}`}
                                  aria-hidden
                                />
                                <span className="min-w-0 flex-1 text-sm font-bold text-[#F0F4F8]">
                                  {d.nutrient}
                                </span>
                                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#8B9AB0]">
                                  {severityLabel(d.severity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={`text-sm ${textSecondary}`}>No deficiency snapshot for this report.</p>
                        )}
                      </div>
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
