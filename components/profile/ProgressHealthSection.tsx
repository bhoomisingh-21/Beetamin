'use client'

import { type ClientRow, type ProgressLogRow } from '@/lib/booking-actions'
import { heading, subheading } from './profile-dark-styles'
import { WeightLogger } from './WeightLogger'
import { BMICard } from './BMICard'
import { WaterIntakeLogger } from './WaterIntakeLogger'
import { EnergyLogger } from './EnergyLogger'
import { SleepLogger } from './SleepLogger'
import { ProgressCharts } from './ProgressCharts'
import { DailyNotes } from './DailyNotes'

type Props = {
  userId: string
  client: ClientRow | null
  progressLogs: ProgressLogRow[]
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}

export function ProgressHealthSection({
  userId,
  client,
  progressLogs,
  onReload,
  onToast,
}: Props) {
  return (
    <section className="space-y-10">
      <div>
        <h2 className={heading}>My Health Progress</h2>
        <p className={subheading}>Track your wellness journey</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WeightLogger
          userId={userId}
          client={client}
          progressLogs={progressLogs}
          onReload={onReload}
          onToast={onToast}
        />
        <BMICard client={client} progressLogs={progressLogs} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WaterIntakeLogger
          userId={userId}
          progressLogs={progressLogs}
          onReload={onReload}
          onToast={onToast}
        />
        <EnergyLogger
          userId={userId}
          progressLogs={progressLogs}
          onReload={onReload}
          onToast={onToast}
        />
      </div>

      <SleepLogger
        userId={userId}
        progressLogs={progressLogs}
        onReload={onReload}
        onToast={onToast}
      />

      <ProgressCharts progressLogs={progressLogs} />

      <DailyNotes
        userId={userId}
        progressLogs={progressLogs}
        onReload={onReload}
        onToast={onToast}
      />
    </section>
  )
}
