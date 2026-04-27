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
import { ProfilePageBanner } from '@/components/profile/ProfilePageBanner'
import { profileCard, textSecondary } from '@/components/profile/profile-dark-styles'

const BANNER =
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80'

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

function motivate(completed: number): string {
  if (completed === 0) return 'Start your wellness journey 🌱'
  if (completed <= 2) return 'Good start! Keep going 💪'
  if (completed <= 4) return "Almost there! You're crushing it 🔥"
  return "All goals complete! You're amazing 🎉"
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
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-[#0F1623] px-5 py-2.5 text-sm font-semibold text-[#F0F4F8] shadow-lg">
          {toast}
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-3xl"
      >
        <div className={`${profileCard} mb-6 p-6`}>
          <p className="text-center text-sm font-semibold text-[#F0F4F8]">
            {completedCount} of 5 goals completed
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#060910]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            />
          </div>
          <p className="mt-4 text-center text-sm text-[#8B9AB0]">{motivate(completedCount)}</p>
        </div>

        <ProfilePageBanner
          src={BANNER}
          alt=""
          title="Wellness Goals"
          subtitle="Check them off as you go"
        />

        <div className="mt-2 space-y-3">
          {texts.map((text, index) => {
            const done = Boolean(progress[String(index)])
            return (
              <motion.button
                key={index}
                layout
                type="button"
                disabled={!client}
                onClick={() => void toggle(index, !done)}
                className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-colors disabled:opacity-40 ${
                  done
                    ? 'border-emerald-500/25 bg-emerald-500/[0.07]'
                    : 'border-white/[0.06] bg-[#0F1623] hover:border-emerald-500/15'
                }`}
                style={{
                  boxShadow:
                    '0 0 0 1px rgba(16,185,129,0.05), 0 4px 24px rgba(0,0,0,0.4)',
                }}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-black'
                      : 'border-[#4B5563] bg-transparent'
                  }`}
                  aria-hidden
                >
                  {done && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[15px] leading-snug transition-colors ${
                      done ? 'text-[#8B9AB0] line-through' : 'font-medium text-[#F0F4F8]'
                    }`}
                  >
                    {text}
                  </p>
                  <p className={`mt-2 text-xs ${textSecondary}`}>Log daily to complete this goal</p>
                </div>

                <div className="shrink-0 pt-0.5">
                  {done ? (
                    <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                      ✓ Completed
                    </span>
                  ) : (
                    <span className="inline-block h-6 w-16" aria-hidden />
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </>
  )
}
