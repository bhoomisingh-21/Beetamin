'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Sparkles } from 'lucide-react'

/** Short message set for the free-assessment teaser wait (a few seconds). */
export const TEASER_LOADING_MESSAGES: string[] = [
  'Analyzing your responses...',
  'Cross-referencing 50+ deficiency markers...',
  'Calculating your deficiency score...',
  'Preparing your personalized insights...',
]

/** Longer message set for the post-payment full-report generation wait. */
export const FULL_REPORT_LOADING_MESSAGES: string[] = [
  'Analysing your responses...',
  'Calculating BMI...',
  'Understanding your eating habits...',
  'Detecting possible nutritional deficiencies...',
  'Preparing your personalized health insights...',
  'Creating your nutrition score...',
  'Designing your 7-day meal plan...',
  'Almost Done...',
]

// Subtle hexagon tile texture, matching the dark-section background pattern used elsewhere in the app.
const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='92'><polygon points='40,3 77,22 77,70 40,89 3,70 3,22' fill='none' stroke='%23FFFFFF' stroke-width='1.4'/></svg>`
const HEX_URL = `data:image/svg+xml,${HEX_SVG}`

export type PremiumLoadingScreenProps = {
  /** Ordered list of checklist messages revealed one at a time. */
  messages: string[]
  /**
   * When true, the parent's async work is done: the checklist is shown fully
   * checked and a brief success flourish plays. While false, the component
   * holds and gently pulses on the last revealed message instead of looping
   * back to the start or claiming completion early.
   */
  isComplete?: boolean
  /** Milliseconds between message advances. Defaults to ~2500ms. */
  intervalMs?: number
  title?: string
  subtitle?: string
}

export default function PremiumLoadingScreen({
  messages,
  isComplete = false,
  intervalMs = 2500,
  title = 'Analyzing Your Health Profile...',
  subtitle = "Sit tight — we're personalizing everything just for you.",
}: PremiumLoadingScreenProps) {
  const total = messages.length
  const [revealedCount, setRevealedCount] = useState(total > 0 ? 1 : 0)

  // Reset the checklist during render (not in an effect) if the caller swaps in a
  // different message set — the React-recommended way to adjust state on prop change.
  const [trackedMessages, setTrackedMessages] = useState(messages)
  if (trackedMessages !== messages) {
    setTrackedMessages(messages)
    setRevealedCount(total > 0 ? 1 : 0)
  }

  useEffect(() => {
    if (revealedCount >= total) return
    const id = window.setInterval(() => {
      setRevealedCount((count) => Math.min(count + 1, total))
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [revealedCount, total, intervalMs])

  const effectiveCount = isComplete ? total : revealedCount
  const activeIndex = effectiveCount - 1
  const progress =
    total === 0 ? 0 : isComplete ? 1 : Math.min(0.96, Math.max(0.05, (activeIndex + 0.5) / total))

  const radius = 46
  const circumference = 2 * Math.PI * radius

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0A0F0A] px-6 py-14 sm:px-10 sm:py-16"
      style={{ backgroundImage: `url("${HEX_URL}")`, backgroundSize: '80px 92px', backgroundRepeat: 'repeat' }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `url("${HEX_URL}")`, backgroundSize: '80px 92px', backgroundRepeat: 'repeat' }} />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/3 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center text-center">
        <div className="relative flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </svg>

          <AnimatePresence mode="wait">
            {isComplete ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"
              >
                <CheckCircle2 className="h-9 w-9 text-emerald-400" strokeWidth={2} />
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                transition={{ rotate: { duration: 5, repeat: Infinity, ease: 'linear' }, opacity: { duration: 0.3 }, scale: { duration: 0.3 } }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10"
              >
                <Sparkles className="h-8 w-8 text-emerald-400" strokeWidth={2} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-7 text-xl font-black text-white sm:text-2xl"
        >
          {title}
        </motion.h2>
        {subtitle ? (
          <p className="mt-2 max-w-xs text-sm text-gray-400 sm:text-base">{subtitle}</p>
        ) : null}

        <div className="mt-8 w-full max-w-sm space-y-2.5 text-left">
          <AnimatePresence initial={false}>
            {messages.slice(0, effectiveCount).map((message, index) => {
              const isRowComplete = isComplete || index < effectiveCount - 1
              const isActiveRow = !isRowComplete && index === activeIndex

              return (
                <motion.div
                  key={message}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#111810] px-4 py-3"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    <AnimatePresence mode="wait">
                      {isRowComplete ? (
                        <motion.span
                          key="check"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.25 }}
                        >
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" strokeWidth={2} />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="pulse"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="relative flex h-2.5 w-2.5 items-center justify-center"
                        >
                          <motion.span
                            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute h-2.5 w-2.5 rounded-full bg-emerald-400"
                          />
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <motion.span
                    animate={isActiveRow ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
                    transition={isActiveRow ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
                    className={`text-sm sm:text-[15px] ${isRowComplete ? 'text-gray-300' : 'text-white font-medium'}`}
                  >
                    {message}
                  </motion.span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isComplete ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6 text-sm font-semibold text-emerald-400"
            >
              All set!
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
