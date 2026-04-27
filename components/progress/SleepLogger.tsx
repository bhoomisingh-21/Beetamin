'use client'

import { useMemo, useState } from 'react'
import { upsertProgressLog, type ProgressLogRow } from '@/lib/booking-actions'
import { darkCardSm, heading } from '@/components/profile/profile-dark-styles'

const QUALITIES = ['Poor', 'Fair', 'Good', 'Great'] as const

type Props = {
  userId: string
  progressLogs: ProgressLogRow[]
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}

export function SleepLogger({ userId, progressLogs, onReload, onToast }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [hours, setHours] = useState(7)
  const [quality, setQuality] = useState<(typeof QUALITIES)[number]>('Good')
  const [saving, setSaving] = useState(false)

  const last7 = useMemo(() => {
    return progressLogs
      .filter((l) => l.sleep_hours != null && Number(l.sleep_hours) > 0)
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      .slice(0, 7)
  }, [progressLogs])

  async function handleLog() {
    setSaving(true)
    try {
      await upsertProgressLog({
        clerkUserId: userId,
        logged_at: today,
        sleep_hours: hours,
        sleep_quality: quality,
      })
      onToast('Sleep logged.')
      await onReload()
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={darkCardSm}>
      <h3 className={`${heading} text-lg`}>Sleep</h3>
      <label className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
        Hours slept (4–12)
      </label>
      <input
        type="number"
        min={4}
        max={12}
        step={0.5}
        value={hours}
        onChange={(e) => setHours(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
      />
      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Quality</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {QUALITIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setQuality(q)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              quality === q
                ? 'border-purple-400/50 bg-purple-500/20 text-purple-200'
                : 'border-white/10 bg-black/30 text-gray-400 hover:border-white/20'
            }`}
          >
            {q}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={() => void handleLog()}
        className="mt-5 w-full rounded-xl border border-purple-500/40 bg-purple-500/15 py-3 text-sm font-black text-purple-200 hover:bg-purple-500/25 disabled:opacity-50"
      >
        Log Sleep
      </button>

      {last7.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Last 7 nights
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {last7.map((row) => (
              <span
                key={row.id}
                className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-gray-300"
              >
                {new Date(row.logged_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
                :{' '}
                <span className="font-bold text-purple-300">
                  {Number(row.sleep_hours).toFixed(1)}h
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
