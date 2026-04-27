'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import {
  updateClientGoalsProgress,
  type ClientRow,
} from '@/lib/booking-actions'
import { heading, subheading } from './profile-dark-styles'

type GoalRow = { id: string; text: string }

function goalsForAssessmentGoal(goal: string | null | undefined): GoalRow[] {
  const g = (goal || '').toLowerCase()
  if (g.includes('energy'))
    return [
      { id: 'e1', text: 'Log energy level for 7 consecutive days' },
      { id: 'e2', text: 'Drink 8 glasses of water daily for 1 week' },
      { id: 'e3', text: 'Sleep 7+ hours for 5 nights' },
      { id: 'e4', text: 'Complete first nutrition session' },
      { id: 'e5', text: 'Log weight for 2 weeks' },
    ]
  if (g.includes('immunity'))
    return [
      { id: 'i1', text: 'Log energy for 7 days' },
      { id: 'i2', text: 'Drink 2L water daily for 1 week' },
      { id: 'i3', text: 'Sleep 7+ hours for 5 nights' },
      { id: 'i4', text: 'Complete first nutrition session' },
      { id: 'i5', text: 'Log weight for 2 weeks' },
    ]
  return [
    { id: 'n1', text: 'Log wellness metrics for 7 days in a row' },
    { id: 'n2', text: 'Stay hydrated — hit your daily water goal for a week' },
    { id: 'n3', text: 'Prioritize sleep — 7+ hours on 5 nights' },
    { id: 'n4', text: 'Book and complete your first nutrition session' },
    { id: 'n5', text: 'Track weight weekly for one month' },
  ]
}

type Props = {
  userId: string
  client: ClientRow | null
  onReload: () => Promise<void>
  onToast: (msg: string) => void
}

export function WellnessGoalsSection({ userId, client, onReload, onToast }: Props) {
  const defaults = useMemo(
    () => goalsForAssessmentGoal(client?.assessment_goal),
    [client?.assessment_goal],
  )

  const initialMap = useMemo(() => {
    const raw = client?.goals_progress
    const m: Record<string, boolean> =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? { ...(raw as Record<string, boolean>) }
        : {}
    return m
  }, [client?.goals_progress])

  const [progress, setProgress] = useState<Record<string, boolean>>(initialMap)

  useEffect(() => {
    setProgress(initialMap)
  }, [initialMap])

  async function toggle(id: string, next: boolean) {
    const prev = progress
    const merged = { ...progress, [id]: next }
    setProgress(merged)
    const res = await updateClientGoalsProgress(userId, merged)
    if (!res.ok) {
      onToast('Could not save goals.')
      setProgress(prev)
      return
    }
    await onReload()
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className={heading}>My Wellness Goals</h2>
        <p className={subheading}>Based on your health goal — check them off as you go</p>
      </div>

      <div className="space-y-3">
        {defaults.map((goal) => {
          const done = Boolean(progress[goal.id])
          return (
            <label
              key={goal.id}
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border border-white/[0.08] bg-[#111820] p-5 transition hover:border-emerald-500/25 ${
                done ? 'opacity-80' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => void toggle(goal.id, e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-emerald-500 focus:ring-emerald-500"
              />
              <span
                className={`flex-1 text-sm leading-relaxed ${
                  done ? 'text-gray-500 line-through' : 'text-gray-200'
                }`}
              >
                {done && (
                  <Check className="mr-2 inline h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                )}
                {goal.text}
              </span>
            </label>
          )
        })}
      </div>
    </section>
  )
}
