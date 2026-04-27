'use client'

import { useEffect, useMemo, useState } from 'react'
import { upsertProgressLog, type ProgressLogRow } from '@/lib/booking-actions'
import { darkCardSm, heading } from '@/components/profile/profile-dark-styles'

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
      ? { emoji: '😴', text: 'Low energy' }
      : energy <= 6
        ? { emoji: '😐', text: 'Moderate' }
        : { emoji: '⚡', text: 'High energy' }

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
    <div className={darkCardSm}>
      <h3 className={`${heading} text-lg`}>Energy Level</h3>
      <input
        type="range"
        min={1}
        max={10}
        value={energy}
        onChange={(e) => setEnergy(Number(e.target.value))}
        className="mt-4 w-full accent-emerald-500"
      />
      <p className="mt-3 text-2xl">
        <span className="mr-2">{emojiLine.emoji}</span>
        <span className="text-lg font-bold text-white">{emojiLine.text}</span>
      </p>
      <p className="text-sm text-gray-500">{energy} / 10</p>

      {yesterdayEnergy != null && (
        <p className="mt-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-gray-400">
          Yesterday: <span className="font-bold text-gray-200">{yesterdayEnergy}/10</span>
        </p>
      )}

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleLog()}
        className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-black hover:bg-emerald-400 disabled:opacity-50"
      >
        Log Energy
      </button>
    </div>
  )
}
