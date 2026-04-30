'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { getDashboardBundle, type DashboardBundle } from '@/lib/booking-actions'
import { ProfilePageBanner } from '@/components/profile/ProfilePageBanner'
import { BMICard } from '@/components/progress/BMICard'
import { DailyNotes } from '@/components/progress/DailyNotes'
import { EnergyLogger } from '@/components/progress/EnergyLogger'
import {
  ProgressCharts,
  type ChartRange,
} from '@/components/progress/ProgressCharts'
import { ProgressIdeasPanel } from '@/components/progress/ProgressIdeasPanel'
import { ProgressTrackerErrorBoundary } from '@/components/progress/ProgressTrackerErrorBoundary'
import { SleepLogger } from '@/components/progress/SleepLogger'
import { WaterLogger } from '@/components/progress/WaterLogger'
import { WeightLogger } from '@/components/progress/WeightLogger'

const BANNER =
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80'

type Props = {
  initialBundle: DashboardBundle
}

export default function ProgressRouteClient({ initialBundle }: Props) {
  const { user } = useUser()
  const [bundle, setBundle] = useState(initialBundle)
  const [toast, setToast] = useState('')
  const [chartRange, setChartRange] = useState<ChartRange>('1M')

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

  const ranges: ChartRange[] = ['1W', '1M', '3M']

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#0F1623] px-5 py-2.5 text-sm font-semibold text-[#F0F4F8] shadow-lg">
          {toast}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-6xl"
      >
        <ProfilePageBanner
          src={BANNER}
          alt=""
          title="Progress Tracker"
          subtitle="Log and track your health metrics"
        />

        <ProgressTrackerErrorBoundary>
          <div className="space-y-10">
            <div>
              <h2 className="text-lg font-black text-[#F0F4F8]">Today&apos;s Logging</h2>
              <p className="mt-1 text-xs text-[#8B9AB0]">Updates save to today&apos;s activity log.</p>
              <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
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
              <SleepLogger
                userId={user.id}
                progressLogs={progressLogs}
                onReload={reload}
                onToast={onToast}
              />
              <div className="lg:col-span-2">
                <DailyNotes
                  userId={user.id}
                  progressLogs={progressLogs}
                  onReload={reload}
                  onToast={onToast}
                />
              </div>
            </div>

            <ProgressIdeasPanel />

            <div className="border-t border-white/[0.06] pt-10">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#F0F4F8]">Your Health Trends</h2>
                  <p className="mt-1 text-sm text-[#8B9AB0]">Visualize patterns over time</p>
                  <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
                </div>
                <div className="flex flex-wrap gap-2">
                  {ranges.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setChartRange(r)}
                      className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                        chartRange === r
                          ? 'bg-emerald-500 text-black'
                          : 'border border-white/10 bg-[#0F1623] text-[#8B9AB0] hover:border-emerald-500/30'
                      }`}
                    >
                      {r === '1W' ? '1W' : r === '1M' ? '1M' : '3M'}
                    </button>
                  ))}
                </div>
              </div>
              <ProgressCharts progressLogs={progressLogs} range={chartRange} />
            </div>
          </div>
        </ProgressTrackerErrorBoundary>
      </motion.div>
    </>
  )
}
