'use client'

import { useMemo, useState } from 'react'
import { upsertProgressLog, type ProgressLogRow } from '@/lib/booking-actions'
import { darkCardSm, heading } from './profile-dark-styles'

const GOAL_ML = 2000
const GLASS_ML = 250

type Props = {
  userId: string
  progressLogs: ProgressLogRow[]
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}

export function WaterIntakeLogger({ userId, progressLogs, onReload, onToast }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [busy, setBusy] = useState(false)

  const todayMl = useMemo(() => {
    const row = progressLogs.find((l) => l.logged_at === today)
    const v = row?.water_ml
    if (v == null) return 0
    return Math.max(0, Number(v))
  }, [progressLogs, today])

  const pct = Math.min(100, Math.round((todayMl / GOAL_ML) * 100))
  const glasses = Math.round(todayMl / GLASS_ML)

  async function add(ml: number) {
    const next = Math.min(GOAL_ML * 2, todayMl + ml)
    setBusy(true)
    try {
      await upsertProgressLog({
        clerkUserId: userId,
        logged_at: today,
        water_ml: next,
      })
      await onReload()
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={darkCardSm}>
      <h3 className={`${heading} text-lg`}>Water</h3>
      <p className="mt-1 text-xs text-gray-500">Daily goal {GOAL_ML / GLASS_ML} glasses ({GOAL_ML} ml)</p>

      <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-black/50">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <span>
          {glasses} of {GOAL_ML / GLASS_ML} glasses
        </span>
        <span>{pct}%</span>
      </div>
      <p className="mt-1 text-sm font-bold text-blue-300">{todayMl} ml today</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void add(250)}
          className="rounded-xl border border-blue-500/40 bg-blue-500/15 px-4 py-2 text-xs font-bold text-blue-200 hover:bg-blue-500/25 disabled:opacity-50"
        >
          +250 ml
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void add(500)}
          className="rounded-xl border border-blue-500/40 bg-blue-500/15 px-4 py-2 text-xs font-bold text-blue-200 hover:bg-blue-500/25 disabled:opacity-50"
        >
          +500 ml
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void add(GLASS_ML)}
          className="rounded-xl border border-blue-500/40 bg-blue-500/15 px-4 py-2 text-xs font-bold text-blue-200 hover:bg-blue-500/25 disabled:opacity-50"
        >
          +1 glass
        </button>
      </div>
    </div>
  )
}
