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

function paidReportIsComplete(status: string) {
  return status === 'ready' || status === 'generated'
}

type Props = {
  paidReports: PaidReportSummary[]
  initialFreeAssessmentFromProfile?: unknown | null
}

const BANNER =
  'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&q=80'

export default function DeficiencyRouteClient({
  paidReports,
  initialFreeAssessmentFromProfile = null,
}: Props) {
  const [freeHydrated, setFreeHydrated] = useState(false)
  const [freeFromLocal, setFreeFromLocal] = useState<unknown | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('assessmentResult')
      setFreeFromLocal(raw ? JSON.parse(raw) : null)
    } catch {
      setFreeFromLocal(null)
    } finally {
      setFreeHydrated(true)
    }
  }, [])

  const freeEffective = (() => {
    if (!freeHydrated) {
      if (hasFreeAssessmentContent(initialFreeAssessmentFromProfile)) {
        return initialFreeAssessmentFromProfile
      }
      return null
    }
    if (hasFreeAssessmentContent(freeFromLocal)) return freeFromLocal
    if (hasFreeAssessmentContent(initialFreeAssessmentFromProfile)) {
      return initialFreeAssessmentFromProfile
    }
    return null
  })()

  const hasPaid = paidReports.some((r) => paidReportIsComplete(r.status))
  const hasFree = hasFreeAssessmentContent(freeEffective)
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

      {hasFree && freeEffective != null && (
        <div className={hasPaid ? 'mt-12' : ''}>
          <FreeAssessmentDeficiencyBlock result={freeEffective} />
        </div>
      )}

      {showEmpty && <DeficiencyEmptyState />}
    </motion.div>
  )
}
