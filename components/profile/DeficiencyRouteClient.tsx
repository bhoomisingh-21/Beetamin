'use client'

import { motion } from 'framer-motion'
import { DeficiencyReportSection } from '@/components/profile/DeficiencyReportSection'
import { ProfilePageBanner } from '@/components/profile/ProfilePageBanner'
import type { PaidReportSummary } from '@/lib/booking-actions'

type Props = {
  paidReports: PaidReportSummary[]
}

const BANNER =
  'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&q=80'

export default function DeficiencyRouteClient({ paidReports }: Props) {
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
        title="Your Deficiency Profile"
        subtitle="Based on your latest paid report"
      />
      <DeficiencyReportSection paidReports={paidReports} showHeading={false} />
    </motion.div>
  )
}
