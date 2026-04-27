'use client'

import { useMemo, useState } from 'react'
import { upsertProgressLog, type ProgressLogRow } from '@/lib/booking-actions'
import { cardSubtitle, cardTitle, profileCard, textSecondary } from '@/components/profile/profile-dark-styles'

type Props = {
  userId: string
  progressLogs: ProgressLogRow[]
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}

export function DailyNotes({ userId, progressLogs, onReload, onToast }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const timeline = useMemo(() => {
    const todayDate = new Date(today)
    const days: string[] = []
    for (let i = 1; i <= 14; i++) {
      const d = new Date(todayDate)
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    return progressLogs
      .filter((l) => days.includes(l.logged_at) && l.notes && String(l.notes).trim())
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      .slice(0, 2)
  }, [progressLogs, today])

  async function handleSave() {
    const n = notes.slice(0, 280)
    setSaving(true)
    try {
      await upsertProgressLog({
        clerkUserId: userId,
        notes: n,
        logged_at: today,
      })
      setNotes('')
      onToast('Note saved.')
      await onReload()
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const taCls =
    'mt-4 min-h-[120px] w-full resize-none rounded-xl border border-white/[0.06] bg-[#060910] px-4 py-3 text-sm text-[#F0F4F8] outline-none ring-emerald-500/20 focus:ring-2 placeholder:text-[#4B5563]'

  return (
    <div className={`${profileCard} p-5 md:p-6`}>
      <h3 className={cardTitle}>Daily Notes</h3>
      <p className={`${cardSubtitle} mt-1`}>How are you feeling today?</p>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value.slice(0, 280))}
        rows={5}
        placeholder="How are you feeling today?"
        className={taCls}
      />
      <div className="mt-1 flex justify-end">
        <span className={`text-xs ${textSecondary}`}>{notes.length}/280</span>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="mt-4 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-black text-black hover:bg-emerald-400 disabled:opacity-50"
      >
        Save Note
      </button>

      {timeline.length > 0 && (
        <div className="mt-8 space-y-4 border-t border-white/[0.06] pt-8">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>
            Recent notes
          </p>
          {timeline.map((row) => (
            <div
              key={row.id}
              className="relative rounded-xl border border-white/[0.06] bg-[#060910] px-4 py-4 pl-8 text-sm"
            >
              <span className="absolute left-3 top-5 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              <p className={`text-[10px] font-bold uppercase tracking-wide ${textSecondary}`}>
                {new Date(row.logged_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className={`mt-2 whitespace-pre-wrap ${textSecondary}`}>{String(row.notes)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
