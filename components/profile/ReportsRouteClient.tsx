'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AssessmentHistorySection } from '@/components/profile/AssessmentHistorySection'
import { ProfilePageBanner } from '@/components/profile/ProfilePageBanner'
import type { PaidReportSummary } from '@/lib/booking-actions'

type Props = {
  paidReports: PaidReportSummary[]
  assessmentDates: Record<string, string>
}

const BANNER =
  'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200&q=80'

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
      className="mx-auto max-w-5xl"
    >
      <ProfilePageBanner
        src={BANNER}
        alt=""
        title="My Reports"
        subtitle="All your assessments and paid reports"
      />
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
