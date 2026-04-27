'use client'

import { motion } from 'framer-motion'
import { DeficiencyReportSection } from '@/components/profile/DeficiencyReportSection'
import type { PaidReportSummary } from '@/lib/booking-actions'
import { heading, subheading } from '@/components/profile/profile-dark-styles'

type Props = {
  paidReports: PaidReportSummary[]
}

export default function DeficiencyRouteClient({ paidReports }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-4xl space-y-10"
    >
      <div>
        <h1 className={`${heading} text-3xl`}>Deficiency Profile</h1>
        <p className={subheading}>Based on your latest paid report</p>
      </div>
      <DeficiencyReportSection paidReports={paidReports} showHeading={false} />
    </motion.div>
  )
}
