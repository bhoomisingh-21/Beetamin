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

const GOAL_COUNT = 5

type GoalItem = {
  text: string
  tip: string
}

function normalizeGoalKey(goal: string | null | undefined): string {
  const g = (goal || '').trim().toLowerCase().replace(/\s+/g, '_')
  if (g === 'skin_hair' || g.includes('skin') || g.includes('hair')) return 'skin_hair'
  if (g.includes('energy')) return 'energy'
  if (g.includes('focus')) return 'focus'
  if (g.includes('immunity')) return 'immunity'
  return 'default'
}

function goalItems(goal: string | null | undefined): GoalItem[] {
  switch (normalizeGoalKey(goal)) {
    case 'energy':
      return [
        {
          text: 'Seven-day energy diary — rate how you feel after logging',
          tip: 'Tiny wins: notice what breakfast or sleep did the day before.',
        },
        {
          text: 'Hydration streak — eight purposeful glasses for seven days',
          tip: 'Flavor water with lemon, cucumber, or herbal tea so it feels like a treat.',
        },
        {
          text: 'Sleep runway — 7+ hours on five nights this week',
          tip: 'Try “reverse alarm”: lights dim + phone docked 45 minutes before bed.',
        },
        {
          text: 'Book *and* attend your first Beetamin nutrition session',
          tip: 'Bring one quirky question — nutritionists love curiosity.',
        },
        {
          text: 'Weight check-ins twice weekly for two weeks',
          tip: 'Same scale, same time of day — consistency beats daily noise.',
        },
      ]
    case 'focus':
      return [
        {
          text: 'Track energy + sleep together for one week',
          tip: 'Fatigue often hides in hydration gaps — watch both curves.',
        },
        {
          text: 'Eight-hour sleep challenge — five nights in a row',
          tip: 'Trade doom-scroll for a paperback chapter — gentler on melatonin.',
        },
        {
          text: 'Two-liter water goal five days this week',
          tip: 'Front-load water before noon so afternoons feel lighter.',
        },
        {
          text: 'Complete two live nutrition sessions',
          tip: 'Ask for one “focus snack” idea you can prep in under five minutes.',
        },
        {
          text: '30-day progress streak on the tracker',
          tip: 'Miss a day? Log anyway — streak psychology loves honesty.',
        },
      ]
    case 'immunity':
      return [
        {
          text: 'Seven-day logging streak (any combo of metrics)',
          tip: 'Patterns reveal triggers faster than perfect spreadsheets.',
        },
        {
          text: 'Water hero week — hit your glass goal every single day',
          tip: 'Pair each meal with a full glass before your first bite.',
        },
        {
          text: 'Repair nights — 7+ hours sleep on five evenings',
          tip: 'Cool bedroom + socks paradoxically helps some people drift off.',
        },
        {
          text: 'Show up for your first nutrition coaching session',
          tip: 'Mention seasonal allergies or gut quirks — context sharpens advice.',
        },
        {
          text: 'Weekly weigh-ins for a month (same ritual)',
          tip: 'Pair weigh-in day with a fun playlist — ritual beats dread.',
        },
      ]
    case 'skin_hair':
      return [
        {
          text: 'Glow hydration sprint — log water daily for fourteen days',
          tip: 'Omega-rich snacks (walnuts, flax) are silent allies for skin elasticity.',
        },
        {
          text: 'Energy pulse — seven quick logs to spot cortisol dips',
          tip: 'Note post-meal crashes — protein pairing often smooths the curve.',
        },
        {
          text: 'Nutrition deep-dive session numero uno',
          tip: 'Snap pics of products you use — labels unlock tailor-made swaps.',
        },
        {
          text: 'Track weight or measurements gently for thirty days',
          tip: 'Progress photos optional — angles matter more than the scale.',
        },
        {
          text: 'Beauty sleep stretch — eight hours, five nights',
          tip: 'Silk-ish pillowcase + hydration before bed = humble glow hack.',
        },
      ]
    default:
      return [
        {
          text: 'Seven-day metric streak — mix weight, water, energy, sleep',
          tip: 'Gamify it: celebrate odd-colored charts — they teach the most.',
        },
        {
          text: 'Hydration party — nail your daily water goal all week',
          tip: 'Sparkling water counts; bubbles make ritual feel festive.',
        },
        {
          text: 'Sleep rebound — 7+ hour nights × five',
          tip: 'Morning sunlight within an hour of waking resets the clock.',
        },
        {
          text: 'Nutrition session unlocked — book + complete one visit',
          tip: 'Voice-note questions beforehand so nothing slips your mind.',
        },
        {
          text: 'Weight rhythm — log twice weekly for a month',
          tip: 'Pair logs with gratitude notes — mindset + metrics scale together.',
        },
      ]
  }
}

const BONUS_TIPS: { title: string; body: string }[] = [
  {
    title: 'Kitchen runway',
    body: 'Prep two proteins on Sunday — weekday lunches stop feeling like improvisation.',
  },
  {
    title: 'Snack detective',
    body: 'Note energy one hour after snacks; patterns beat guilt.',
  },
  {
    title: 'Joy movement',
    body: 'Dance-cleaning, pickleball, or stroller laps — joyful cardio sticks.',
  },
  {
    title: 'Micro-boundaries',
    body: 'One notification-free hour protects focus and evening cortisol.',
  },
]

function motivate(completed: number): string {
  if (completed === 0)
    return 'Blank slate energy — tap any checkbox when you’re ready to rumble.'
  if (completed <= 2) return 'Momentum brewing — science loves messy consistency.'
  if (completed <= 4) return 'Almost badges unlocked — finish strong, not perfect.'
  return 'Full house — treat yourself to something wonderfully ordinary today.'
}

type Props = {
  initialBundle: DashboardBundle
}

export default function GoalsRouteClient({ initialBundle }: Props) {
  const { user } = useUser()
  const client = initialBundle.client
  const items = useMemo(() => goalItems(client?.assessment_goal), [client?.assessment_goal])

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
    return items.reduce((n, _, i) => (progress[String(i)] ? n + 1 : n), 0)
  }, [items, progress])

  const pct = Math.round((completedCount / GOAL_COUNT) * 100)

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
            {completedCount} of {GOAL_COUNT} goals completed
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
          subtitle="Serious outcomes, playful rituals — tap to celebrate progress"
        />

        <div className="mt-2 space-y-3">
          {items.map(({ text, tip }, index) => {
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
                  <p className={`mt-2 text-xs leading-relaxed ${textSecondary}`}>{tip}</p>
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

        <section className="mt-10 rounded-2xl border border-white/[0.06] bg-[#0C1117]/80 p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.04),0_8px_32px_rgba(0,0,0,0.35)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#F0F4F8]">Extra credit playbook</h2>
              <p className={`mt-1 text-sm ${textSecondary}`}>
                Zero pressure bonuses — steal one idea when curiosity strikes.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-[#0F1623] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8B9AB0]">
              Optional sparkle
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {BONUS_TIPS.map(({ title, body }) => (
              <div
                key={title}
                className={`${profileCard} p-4 transition hover:border-emerald-500/18`}
              >
                <p className="text-[13px] font-bold text-emerald-400">{title}</p>
                <p className={`mt-2 text-[11px] leading-relaxed ${textSecondary}`}>{body}</p>
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    </>
  )
}
