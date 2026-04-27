'use client'

import { useEffect, useMemo, useState } from 'react'
import { upsertProgressLog, type ClientRow, type ProgressLogRow } from '@/lib/booking-actions'
import { darkCardSm, heading } from '@/components/profile/profile-dark-styles'

type Props = {
  userId: string
  client: ClientRow | null
  progressLogs: ProgressLogRow[]
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}

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
    <div className={darkCardSm}>
      <h3 className={`${heading} text-lg`}>Weight</h3>
      <label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
        Weight (kg)
      </label>
      <input
        type="number"
        step="0.1"
        value={weightKg}
        onChange={(e) => setWeightKg(e.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-600"
        placeholder="e.g. 65.5"
      />
      <label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
        Date
      </label>
      <input
        type="date"
        value={logDate}
        onChange={(e) => setLogDate(e.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
      />
      <label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
        Height (cm)
        {!client?.height_cm && (
          <span className="ml-2 font-semibold normal-case text-amber-400/90">
            Required on first log
          </span>
        )}
      </label>
      <input
        type="number"
        step="0.1"
        value={heightCm}
        onChange={(e) => setHeightCm(e.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-600"
        placeholder={client?.height_cm ? String(client.height_cm) : 'e.g. 165'}
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSubmit()}
        className="mt-5 w-full rounded-xl bg-emerald-500 py-3 text-sm font-black text-black hover:bg-emerald-400 disabled:opacity-50"
      >
        Log Weight
      </button>

      {recentWeights.length > 0 && (
        <ul className="mt-6 space-y-2 border-t border-white/10 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Recent</p>
          {recentWeights.map((row) => (
            <li key={row.id} className="flex justify-between text-sm text-gray-300">
              <span>
                {new Date(row.logged_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="font-bold text-emerald-400">{Number(row.weight_kg).toFixed(1)} kg</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
