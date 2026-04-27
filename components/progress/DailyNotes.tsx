'use client'

import { useMemo, useState } from 'react'
import { upsertProgressLog, type ProgressLogRow } from '@/lib/booking-actions'
import { darkCardSm, heading } from '@/components/profile/profile-dark-styles'

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
    for (let i = 1; i <= 3; i++) {
      const d = new Date(todayDate)
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    return progressLogs
      .filter((l) => days.includes(l.logged_at) && l.notes && String(l.notes).trim())
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
      .slice(0, 3)
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

  return (
    <div className={darkCardSm}>
      <h3 className={`${heading} text-lg`}>Daily Notes</h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value.slice(0, 280))}
        rows={4}
        placeholder="How are you feeling today?"
        className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-gray-600"
      />
      <p className="mt-2 text-xs text-gray-500">{notes.length}/280</p>
      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="mt-4 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-black hover:bg-emerald-400 disabled:opacity-50"
      >
        Save Note
      </button>

      {timeline.length > 0 && (
        <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Previous days
          </p>
          {timeline.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3 text-sm text-gray-300"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                {new Date(row.logged_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-gray-400">{String(row.notes)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
