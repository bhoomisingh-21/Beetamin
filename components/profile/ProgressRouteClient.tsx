'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import {
  getDashboardBundle,
  type DashboardBundle,
} from '@/lib/booking-actions'
import { heading, subheading } from '@/components/profile/profile-dark-styles'
import { WeightLogger } from '@/components/progress/WeightLogger'
import { BMICard } from '@/components/progress/BMICard'
import { WaterLogger } from '@/components/progress/WaterLogger'
import { EnergyLogger } from '@/components/progress/EnergyLogger'
import { SleepLogger } from '@/components/progress/SleepLogger'
import { DailyNotes } from '@/components/progress/DailyNotes'
import { ProgressCharts } from '@/components/progress/ProgressCharts'
import { ProgressTrackerErrorBoundary } from '@/components/progress/ProgressTrackerErrorBoundary'

type Props = {
  initialBundle: DashboardBundle
}

export default function ProgressRouteClient({ initialBundle }: Props) {
  const { user } = useUser()
  const [bundle, setBundle] = useState(initialBundle)
  const [toast, setToast] = useState('')

  const reload = useCallback(async () => {
    if (!user?.id) return
    try {
      const b = await getDashboardBundle(user.id)
      setBundle(b)
    } catch {
      /* fallback */
    }
  }, [user?.id])

  useEffect(() => {
    setBundle(initialBundle)
  }, [initialBundle])

  const onToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  if (!user) return null

  const { client, progressLogs } = bundle

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/15 bg-[#111820] px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-5xl"
      >
        <h1 className={`${heading} text-3xl`}>Progress Tracker</h1>
        <p className={subheading}>Log and track your health metrics</p>

        <ProgressTrackerErrorBoundary>
          <div className="mt-10 space-y-10">
            <div>
              <h2 className={`${heading} text-lg text-white`}>Today&apos;s Logging</h2>
              <p className="mt-1 text-xs text-gray-500">Everything saves to today&apos;s log.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <WeightLogger
                userId={user.id}
                client={client}
                progressLogs={progressLogs}
                onReload={reload}
                onToast={onToast}
              />
              <BMICard client={client} progressLogs={progressLogs} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <WaterLogger
                userId={user.id}
                progressLogs={progressLogs}
                onReload={reload}
                onToast={onToast}
              />
              <EnergyLogger
                userId={user.id}
                progressLogs={progressLogs}
                onReload={reload}
                onToast={onToast}
              />
            </div>

            <SleepLogger
              userId={user.id}
              progressLogs={progressLogs}
              onReload={reload}
              onToast={onToast}
            />

            <DailyNotes
              userId={user.id}
              progressLogs={progressLogs}
              onReload={reload}
              onToast={onToast}
            />

            <div className="border-t border-white/[0.06] pt-10">
              <h2 className={`${heading} mb-2 text-xl`}>Your Trends</h2>
              <p className={`${subheading} mb-6`}>Charts update when you have enough history.</p>
              <ProgressCharts progressLogs={progressLogs} />
            </div>
          </div>
        </ProgressTrackerErrorBoundary>
      </motion.div>
    </>
  )
}
