'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'

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
  /** Sit flush inside an existing white card (quiz). Default is a standalone white panel. */
  embedded?: boolean
}

export default function PremiumLoadingScreen({
  messages,
  isComplete = false,
  intervalMs = 2500,
  title = 'Analyzing Your Health Profile...',
  subtitle = "Sit tight — we're personalizing everything just for you.",
  embedded = false,
}: PremiumLoadingScreenProps) {
  const total = messages.length
  const [revealedCount, setRevealedCount] = useState(total > 0 ? 1 : 0)

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
      className={
        embedded
          ? 'relative w-full bg-white px-1 py-6 sm:py-8'
          : 'relative w-full rounded-3xl border border-gray-100 bg-white px-6 py-12 sm:px-10 sm:py-14'
      }
    >
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="5" />
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth="5"
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
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={2} />
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50"
              >
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" strokeWidth={2.25} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 text-xl font-black text-gray-900 sm:text-2xl"
        >
          {title}
        </motion.h2>
        {subtitle ? (
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500 sm:text-base">{subtitle}</p>
        ) : null}

        <div className="mt-8 w-full max-w-sm space-y-2 text-left">
          <AnimatePresence initial={false}>
            {messages.slice(0, effectiveCount).map((message, index) => {
              const isRowComplete = isComplete || index < effectiveCount - 1
              const isActiveRow = !isRowComplete && index === activeIndex

              return (
                <motion.div
                  key={message}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {isRowComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={2} />
                    ) : (
                      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                        <motion.span
                          animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute h-2.5 w-2.5 rounded-full bg-emerald-500"
                        />
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                    )}
                  </span>
                  <motion.span
                    animate={isActiveRow ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
                    transition={isActiveRow ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
                    className={`text-sm sm:text-[15px] ${isRowComplete ? 'text-gray-500' : 'font-medium text-gray-900'}`}
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
              className="mt-6 text-sm font-semibold text-emerald-600"
            >
              All set!
            </motion.p>
          ) : (
            <p className="mt-6 text-xs text-gray-400">Please keep this tab open. We&apos;ll take it from here.</p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
