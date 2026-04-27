'use client'

import { useMemo, useState } from 'react'
import { Droplet } from 'lucide-react'
import { upsertProgressLog, type ProgressLogRow } from '@/lib/booking-actions'
import { cardSubtitle, cardTitle, profileCard, textSecondary } from '@/components/profile/profile-dark-styles'

const GOAL_ML = 2000
const GLASS_ML = 250

type Props = {
  userId: string
  progressLogs: ProgressLogRow[]
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}

export function WaterLogger({ userId, progressLogs, onReload, onToast }: Props) {
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
  const circumference = 2 * Math.PI * 42
  const dash = (pct / 100) * circumference

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
    <div className={`${profileCard} border-blue-500/10 p-5 ring-1 ring-blue-500/5`}>
      <div className="flex items-center gap-2">
        <Droplet className="h-5 w-5 text-blue-400" aria-hidden />
        <h3 className={cardTitle}>Water Intake</h3>
      </div>
      <p className={`${cardSubtitle} mt-1`}>Daily goal: 8 glasses (2000ml)</p>

      <div className="relative mx-auto mt-6 flex h-40 w-40 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(59,130,246,0.12)"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-black text-[#F0F4F8]">
            {glasses} / 8
          </p>
          <p className="text-xs font-semibold text-blue-300">glasses</p>
          <p className={`mt-1 text-[11px] ${textSecondary}`}>{todayMl} ml</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { ml: GLASS_ML, label: '+1', sub: '250ml' },
          { ml: 500, label: '+2', sub: '500ml' },
          { ml: 500, label: '+500', sub: 'ml' },
          { ml: 1000, label: '+1L', sub: '' },
        ].map((b, idx) => (
          <button
            key={`water-add-${idx}`}
            type="button"
            disabled={busy}
            onClick={() => void add(b.ml)}
            className="flex flex-col items-center gap-0.5 rounded-xl border border-blue-500/25 bg-blue-500/10 px-2 py-2.5 text-[11px] font-bold text-blue-200 transition hover:bg-blue-500/20 disabled:opacity-50"
          >
            <Droplet className="h-3.5 w-3.5 opacity-80" aria-hidden />
            <span>{b.label}</span>
            {b.sub ? <span className="font-normal opacity-70">{b.sub}</span> : null}
          </button>
        ))}
      </div>
    </div>
  )
}
