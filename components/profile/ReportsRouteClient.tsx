'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AssessmentHistorySection } from '@/components/profile/AssessmentHistorySection'
import type { PaidReportSummary } from '@/lib/booking-actions'
import { heading, subheading } from '@/components/profile/profile-dark-styles'

type Props = {
  paidReports: PaidReportSummary[]
  assessmentDates: Record<string, string>
}

export default function ReportsRouteClient({
  paidReports,
  assessmentDates,
}: Props) {
  const [expandedReport, setExpandedReport] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-5xl space-y-10"
    >
      <div>
        <h1 className={`${heading} text-3xl`}>My Reports</h1>
        <p className={subheading}>All your assessments and paid reports</p>
      </div>
      <AssessmentHistorySection
        paidReports={paidReports}
        assessmentDates={assessmentDates}
        expandedReport={expandedReport}
        setExpandedReport={setExpandedReport}
        showHeading={false}
      />
    </motion.div>
  )
}
