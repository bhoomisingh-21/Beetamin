'use client'

import { useEffect, useMemo, useState } from 'react'
import { Scale } from 'lucide-react'
import { upsertProgressLog, type ClientRow, type ProgressLogRow } from '@/lib/booking-actions'
import { cardSubtitle, cardTitle, profileCard, textSecondary } from '@/components/profile/profile-dark-styles'

type Props = {
  userId: string
  client: ClientRow | null
  progressLogs: ProgressLogRow[]
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}

const inputCls =
  'mt-2 w-full rounded-xl border border-white/[0.06] bg-[#060910] px-3 py-2.5 text-sm text-[#F0F4F8] outline-none ring-emerald-500/20 focus:ring-2 placeholder:text-[#4B5563]'

export function WeightLogger({ userId, client, progressLogs, onReload, onToast }: Props) {
  const [weightKg, setWeightKg] = useState('')
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [heightCm, setHeightCm] = useState(client?.height_cm != null ? String(client.height_cm) : '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (client?.height_cm != null) setHeightCm(String(client.height_cm))
  }, [client?.height_cm])

  const recentWeights = useMemo(() => {
    return progressLogs
      .filter((l) => l.weight_kg != null)
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      .slice(0, 5)
  }, [progressLogs])

  async function handleSubmit() {
    setSaving(true)
    try {
      const w = weightKg.trim() === '' ? null : parseFloat(weightKg)
      if (w == null || Number.isNaN(w) || w < 20 || w > 300) {
        onToast('Enter a valid weight in kg.')
        return
      }
      const h = heightCm.trim() === '' ? null : parseFloat(heightCm)
      if (!client?.height_cm && (h == null || Number.isNaN(h) || h < 50 || h > 280)) {
        onToast('Please enter your height in cm.')
        return
      }
      await upsertProgressLog({
        clerkUserId: userId,
        weight_kg: w,
        logged_at: logDate,
        height_cm: h,
      })
      setWeightKg('')
      onToast('Weight saved.')
      await onReload()
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`${profileCard} p-5`}>
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-emerald-500" aria-hidden />
        <h3 className={cardTitle}>Weight</h3>
      </div>
      <p className={`${cardSubtitle} mt-1`}>Log your weight in kg</p>

      <label className={`mt-5 block ${cardSubtitle}`}>Weight (kg)</label>
      <input
        type="number"
        step="0.1"
        value={weightKg}
        onChange={(e) => setWeightKg(e.target.value)}
        className={inputCls}
        placeholder="e.g. 65.5"
      />

      <label className={`mt-4 block ${cardSubtitle}`}>Date</label>
      <input
        type="date"
        value={logDate}
        onChange={(e) => setLogDate(e.target.value)}
        className={inputCls}
      />

      {!client?.height_cm && (
        <>
          <label className={`mt-4 block ${cardSubtitle}`}>
            Height (cm){' '}
            <span className="text-amber-400/90">· required on first log</span>
          </label>
          <input
            type="number"
            step="0.1"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className={inputCls}
            placeholder="e.g. 165"
          />
        </>
      )}

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSubmit()}
        className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-sm font-black text-black shadow-[0_4px_20px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400 disabled:opacity-50"
      >
        Log Weight
      </button>

      {recentWeights.length > 0 && (
        <ul className="mt-6 space-y-3 border-t border-white/[0.06] pt-5">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Recent</p>
          {recentWeights.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span className={textSecondary}>
                  {new Date(row.logged_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </span>
              <span className="font-bold text-emerald-400">{Number(row.weight_kg).toFixed(1)} kg</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
