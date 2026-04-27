'use client'

import { useEffect, useMemo, useState } from 'react'
import { upsertProgressLog, type ProgressLogRow } from '@/lib/booking-actions'
import { cardSubtitle, cardTitle, profileCard, textSecondary } from '@/components/profile/profile-dark-styles'

type Props = {
  userId: string
  progressLogs: ProgressLogRow[]
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}

export function EnergyLogger({ userId, progressLogs, onReload, onToast }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [energy, setEnergy] = useState(5)
  const [saving, setSaving] = useState(false)

  const yesterdayStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  }, [])

  const todayEnergySaved = useMemo(() => {
    const row = progressLogs.find((l) => l.logged_at === today)
    return row?.energy_level != null ? Number(row.energy_level) : null
  }, [progressLogs, today])

  const yesterdayEnergy = useMemo(() => {
    const row = progressLogs.find((l) => l.logged_at === yesterdayStr)
    return row?.energy_level != null ? Number(row.energy_level) : null
  }, [progressLogs, yesterdayStr])

  useEffect(() => {
    if (todayEnergySaved != null) setEnergy(todayEnergySaved)
  }, [todayEnergySaved])

  const emojiLine =
    energy <= 3
      ? { emoji: '😴', text: 'Low' }
      : energy <= 6
        ? { emoji: '😐', text: 'Moderate' }
        : { emoji: '⚡', text: 'High' }

  async function handleLog() {
    setSaving(true)
    try {
      await upsertProgressLog({
        clerkUserId: userId,
        energy_level: energy,
        logged_at: today,
      })
      onToast('Energy saved.')
      await onReload()
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`${profileCard} p-5`}>
      <h3 className={cardTitle}>Energy Level</h3>
      <p className={`${cardSubtitle} mt-1`}>Slide to rate how you feel</p>

      <input
        type="range"
        min={1}
        max={10}
        value={energy}
        onChange={(e) => setEnergy(Number(e.target.value))}
        className="energy-slider mt-8 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#141B24]"
      />

      <div className="mt-8 flex flex-col items-center gap-2">
        <span className="text-5xl">{emojiLine.emoji}</span>
        <p className="text-xl font-black text-[#F0F4F8]">{energy}</p>
        <p className={`text-sm font-semibold ${textSecondary}`}>{emojiLine.text}</p>
      </div>

      {yesterdayEnergy != null && (
        <p className="mt-6 rounded-xl border border-white/[0.06] bg-[#060910] px-4 py-3 text-center text-sm text-[#8B9AB0]">
          <span className="font-bold text-emerald-400">
            {energy >= yesterdayEnergy ? '↑' : '↓'} from {yesterdayEnergy}
          </span>{' '}
          yesterday
        </p>
      )}

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleLog()}
        className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-sm font-black text-black hover:bg-emerald-400 disabled:opacity-50"
      >
        Log Energy
      </button>

      <style jsx>{`
        .energy-slider::-webkit-slider-thumb {
          appearance: none;
          height: 22px;
          width: 22px;
          border-radius: 9999px;
          background: #10b981;
          border: 3px solid #060910;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4);
        }
        .energy-slider::-moz-range-thumb {
          height: 22px;
          width: 22px;
          border-radius: 9999px;
          background: #10b981;
          border: 3px solid #060910;
        }
        .energy-slider::-webkit-slider-runnable-track {
          height: 8px;
          border-radius: 9999px;
          background: linear-gradient(to right, #ef4444 0%, #f59e0b 45%, #10b981 100%);
        }
      `}</style>
    </div>
  )
}
