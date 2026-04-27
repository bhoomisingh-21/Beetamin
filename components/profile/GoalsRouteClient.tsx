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

function goalTexts(goal: string | null | undefined): string[] {
  const g = (goal || '').toLowerCase()
  if (g.includes('energy'))
    return [
      'Log energy level for 7 consecutive days',
      'Drink 8 glasses of water daily for 1 week',
      'Sleep 7+ hours for 5 nights in a row',
      'Book and complete your first nutrition session',
      'Log your weight for 2 weeks',
    ]
  if (g.includes('focus'))
    return [
      'Log energy level daily for 7 days',
      'Sleep 8 hours for 5 consecutive nights',
      'Drink 2L water daily for 1 week',
      'Complete 2 nutrition sessions',
      'Track progress for 30 days',
    ]
  if (g.includes('immunity'))
    return [
      'Log wellness metrics for 7 days in a row',
      'Hit water goal daily for 1 week',
      'Sleep 7+ hours for 5 nights',
      'Complete first nutrition session',
      'Log weight weekly for 1 month',
    ]
  if (g.includes('skin') || g.includes('hair'))
    return [
      'Log water intake daily for 2 weeks',
      'Log energy for 7 days',
      'Complete first nutrition session',
      'Track weight for 1 month',
      'Sleep 8 hours for 5 nights',
    ]
  return [
    'Log wellness metrics for 7 days in a row',
    'Stay hydrated — hit water goal for a week',
    'Prioritize sleep — 7+ hours for 5 nights',
    'Book and complete your first nutrition session',
    'Track weight weekly for one month',
  ]
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

        <div className="mt-10 space-y-3">
          {texts.map((text, index) => {
            const done = Boolean(progress[String(index)])
            return (
              <motion.label
                key={index}
                layout
                className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${
                  done
                    ? 'border-emerald-500/35 bg-emerald-500/15'
                    : 'border-white/[0.08] bg-[#111820] hover:border-emerald-500/25'
                }`}
              >
                <input
                  type="checkbox"
                  checked={done}
                  disabled={!client}
                  onChange={(e) => void toggle(index, e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-emerald-500 focus:ring-emerald-500 disabled:opacity-40"
                />
                <span
                  className={`flex-1 text-sm leading-relaxed transition ${
                    done ? 'text-gray-400 line-through' : 'text-gray-200'
                  }`}
                >
                  {done && (
                    <Check className="mr-2 inline h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  )}
                  {text}
                </span>
              </motion.label>
            )
          })}
        </div>
      </motion.div>
    </>
  )
}
