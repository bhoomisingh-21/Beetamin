'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  DeficiencyEmptyState,
  DeficiencyReportSection,
} from '@/components/profile/DeficiencyReportSection'
import { FreeAssessmentDeficiencyBlock } from '@/components/profile/FreeAssessmentDeficiencyBlock'
import { hasFreeAssessmentContent } from '@/components/profile/deficiency-free-storage'
import { ProfilePageBanner } from '@/components/profile/ProfilePageBanner'
import type { PaidReportSummary } from '@/lib/booking-actions'

type Props = {
  paidReports: PaidReportSummary[]
}

const BANNER =
  'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&q=80'

export default function DeficiencyRouteClient({ paidReports }: Props) {
  const [freeHydrated, setFreeHydrated] = useState(false)
  const [freeAssessment, setFreeAssessment] = useState<unknown | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('assessmentResult')
      setFreeAssessment(raw ? JSON.parse(raw) : null)
    } catch {
      setFreeAssessment(null)
    } finally {
      setFreeHydrated(true)
    }
  }, [])

  const hasPaid = paidReports.some((r) => r.status === 'ready')
  const hasFree = hasFreeAssessmentContent(freeAssessment)
  const showEmpty = freeHydrated && !hasPaid && !hasFree

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
        subtitle="Paid report and free quiz results"
      />

      {hasPaid && <DeficiencyReportSection paidReports={paidReports} showHeading={false} />}

      {freeHydrated && hasFree && (
        <div className={hasPaid ? 'mt-12' : ''}>
          <FreeAssessmentDeficiencyBlock result={freeAssessment} />
        </div>
      )}

      {showEmpty && <DeficiencyEmptyState />}
    </motion.div>
  )
}
