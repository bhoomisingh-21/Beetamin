'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import {
  getDashboardBundle,
  updateClientGoalsProgress,
  type DashboardBundle,
} from '@/lib/booking-actions'
import { heading, subheading } from '@/components/profile/profile-dark-styles'

function normalizeGoalKey(goal: string | null | undefined): string {
  const g = (goal || '').trim().toLowerCase().replace(/\s+/g, '_')
  if (g === 'skin_hair' || g.includes('skin') || g.includes('hair')) return 'skin_hair'
  if (g.includes('energy')) return 'energy'
  if (g.includes('focus')) return 'focus'
  if (g.includes('immunity')) return 'immunity'
  return 'default'
}

function goalTexts(goal: string | null | undefined): string[] {
  switch (normalizeGoalKey(goal)) {
    case 'energy':
      return [
        'Log energy level for 7 consecutive days',
        'Drink 8 glasses of water daily for 1 week',
        'Sleep 7+ hours for 5 nights in a row',
        'Book and complete your first nutrition session',
        'Log your weight for 2 weeks',
      ]
    case 'focus':
      return [
        'Log energy level daily for 7 days',
        'Sleep 8 hours for 5 consecutive nights',
        'Drink 2L water daily for 1 week',
        'Complete 2 nutrition sessions',
        'Track your progress for 30 days',
      ]
    case 'immunity':
      return [
        'Log wellness metrics for 7 days in a row',
        'Hit your water goal daily for a week',
        'Sleep 7+ hours for 5 nights',
        'Complete your first nutrition session',
        'Log weight weekly for 1 month',
      ]
    case 'skin_hair':
      return [
        'Log water intake daily for 2 weeks',
        'Log energy level for 7 days',
        'Complete your first nutrition session',
        'Track weight for 1 month',
        'Sleep 8 hours for 5 nights',
      ]
    default:
      return [
        'Log wellness metrics for 7 days in a row',
        'Stay hydrated — hit daily water goal for a week',
        'Prioritize sleep — 7+ hours for 5 nights',
        'Book and complete your first nutrition session',
        'Track weight weekly for one month',
      ]
  }
}

type Props = {
  initialBundle: DashboardBundle
}

export default function GoalsRouteClient({ initialBundle }: Props) {
  const { user } = useUser()
  const client = initialBundle.client
  const texts = useMemo(() => goalTexts(client?.assessment_goal), [client?.assessment_goal])

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

  const reload = useCallback(async () => {
    if (!user?.id) return
    try {
      const b = await getDashboardBundle(user.id)
      const raw = b.client?.goals_progress
      const m: Record<string, boolean> =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? { ...(raw as Record<string, boolean>) }
          : {}
      setProgress(m)
    } catch {
      /* ignore */
    }
  }, [user?.id])

  const [toast, setToast] = useState('')

  const completedCount = useMemo(() => {
    return texts.reduce((n, _, i) => (progress[String(i)] ? n + 1 : n), 0)
  }, [texts, progress])

  const pct = Math.round((completedCount / 5) * 100)

  async function toggle(index: number, next: boolean) {
    const key = String(index)
    const prev = progress
    const merged = { ...progress, [key]: next }
    setProgress(merged)
    if (!user?.id || !client) {
      setToast('Complete your profile to save goals.')
      setTimeout(() => setToast(''), 3000)
      setProgress(prev)
      return
    }
    const res = await updateClientGoalsProgress(user.id, merged)
    if (!res.ok) {
      setToast('Could not save goals.')
      setProgress(prev)
      setTimeout(() => setToast(''), 3000)
      return
    }
    await reload()
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/15 bg-[#111820] px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-3xl"
      >
        <h1 className={`${heading} text-3xl`}>Wellness Goals</h1>
        <p className={subheading}>Check them off as you go</p>

        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#111820] p-5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold text-white">
              {completedCount} of 5 goals completed
            </span>
            <span className="tabular-nums text-emerald-400">{pct}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/50">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {texts.map((text, index) => {
            const done = Boolean(progress[String(index)])
            return (
              <motion.button
                key={index}
                layout
                type="button"
                disabled={!client}
                onClick={() => void toggle(index, !done)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-colors disabled:opacity-40 ${
                  done
                    ? 'border-emerald-500/30 bg-emerald-500/[0.08]'
                    : 'border-white/[0.08] bg-[#111820] hover:border-emerald-500/20'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-black'
                      : 'border-white/25 bg-transparent'
                  }`}
                  aria-hidden
                >
                  {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>

                <span
                  className={`min-w-0 flex-1 text-sm leading-relaxed transition-colors ${
                    done ? 'text-gray-400 line-through' : 'font-medium text-white'
                  }`}
                >
                  {text}
                </span>

                {done ? (
                  <Check className="h-6 w-6 shrink-0 text-emerald-400" strokeWidth={2.5} aria-hidden />
                ) : (
                  <span className="h-6 w-6 shrink-0" aria-hidden />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </>
  )
}
