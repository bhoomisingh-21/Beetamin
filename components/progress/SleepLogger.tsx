'use client'

import { useMemo, useState } from 'react'
import { Moon } from 'lucide-react'
import { upsertProgressLog, type ProgressLogRow } from '@/lib/booking-actions'
import { cardSubtitle, cardTitle, profileCard, textSecondary } from '@/components/profile/profile-dark-styles'

const QUALITIES = ['Poor', 'Fair', 'Good', 'Great'] as const

function qualityCls(q: string, active: boolean) {
  if (!active)
    return 'border-white/[0.06] bg-[#060910] text-[#8B9AB0] hover:border-white/10'
  const map: Record<string, string> = {
    Poor: 'border-red-500/40 bg-red-500/15 text-red-300',
    Fair: 'border-orange-500/40 bg-orange-500/15 text-orange-200',
    Good: 'border-blue-500/40 bg-blue-500/15 text-blue-200',
    Great: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
  }
  return map[q] ?? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
}

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

  const todayRow = progressLogs.find((l) => l.logged_at === today && l.sleep_hours != null)

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

  const inputCls =
    'mt-2 w-full rounded-xl border border-white/[0.06] bg-[#060910] px-4 py-4 text-center text-4xl font-black text-[#F0F4F8] outline-none ring-violet-500/20 focus:ring-2'

  return (
    <div className={`${profileCard} p-5 ring-1 ring-violet-500/10`}>
      <div className="flex items-center gap-2">
        <Moon className="h-5 w-5 text-violet-400" aria-hidden />
        <h3 className={cardTitle}>Sleep</h3>
      </div>
      <p className={`${cardSubtitle} mt-1`}>Hours and quality for last night</p>

      <label className={`mt-6 block text-center ${cardSubtitle}`}>Hours slept</label>
      <input
        type="number"
        min={4}
        max={12}
        step={0.5}
        value={hours}
        onChange={(e) => setHours(Number(e.target.value))}
        className={inputCls}
      />

      <p className={`mt-6 ${cardSubtitle}`}>Quality</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {QUALITIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setQuality(q)}
            className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${qualityCls(q, quality === q)}`}
          >
            {q}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleLog()}
        className="mt-6 w-full rounded-xl border border-violet-500/35 bg-violet-500/15 py-3 text-sm font-black text-violet-200 hover:bg-violet-500/25 disabled:opacity-50"
      >
        Log Sleep
      </button>

      {todayRow && (
        <p className={`mt-4 text-center text-xs ${textSecondary}`}>
          Last logged tonight:{' '}
          <span className="font-bold text-[#F0F4F8]">{Number(todayRow.sleep_hours).toFixed(1)}h</span>
        </p>
      )}

      {last7.length > 0 && (
        <div className="mt-6 border-t border-white/[0.06] pt-5">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>
            Recent nights
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {last7.map((row) => (
              <span
                key={row.id}
                className="rounded-full border border-white/[0.06] bg-[#060910] px-3 py-1.5 text-[11px] text-[#8B9AB0]"
              >
                {new Date(row.logged_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
                :{' '}
                <span className="font-bold text-violet-300">{Number(row.sleep_hours).toFixed(1)}h</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
