'use client'

import { ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { ActionPlanStep } from '@/components/assessment/ActionPlanStep'
import { ImpactAreaCard } from '@/components/assessment/ImpactAreaCard'
import { NutrientGapCard } from '@/components/assessment/NutrientGapCard'
import { RecoveryTrendCard } from '@/components/assessment/RecoveryTrendCard'
import { ScoreRing } from '@/components/assessment/ScoreRing'
import {
  headlineParts,
  mapActionSteps,
  mapFocusChips,
  mapImpactAreas,
  mapNutrientGaps,
  riskLabel,
  riskSummary,
} from '@/lib/assessment-results-visuals'

const RING_COLOR = {
  high: '#EF4444',
  moderate: '#F97316',
  low: '#10B981',
} as const

const BADGE = {
  high: 'bg-red-50 text-red-600',
  moderate: 'bg-orange-50 text-orange-600',
  low: 'bg-emerald-50 text-emerald-700',
} as const

const CHIP = {
  energy: 'bg-orange-50 text-orange-500',
  protect: 'bg-emerald-50 text-emerald-600',
  immune: 'bg-violet-50 text-violet-600',
} as const

export function FreeHealthReport({
  name,
  score,
  scoreAnimated,
  goal,
  deficiencies,
  quickWins,
  meta,
}: {
  name: string
  score: number
  scoreAnimated: number
  goal: string
  deficiencies: { nutrient?: string; severity?: string; reason?: string }[]
  quickWins: string[]
  meta: Record<string, unknown>
}) {
  const headline = headlineParts(score, name)
  const risk = riskLabel(score)
  const gaps = mapNutrientGaps(deficiencies)
  const impacts = mapImpactAreas(meta)
  const chips = mapFocusChips(goal, gaps)
  const steps = mapActionSteps(quickWins)
  const possess = name.trim() ? `${name.trim()}'s` : 'Your'

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, delay },
  })

  return (
    <div className="space-y-6 md:space-y-8">
      <motion.section {...fadeUp(0)} className="relative">
        <div className="absolute right-0 top-0 hidden max-w-[140px] rounded-xl border border-emerald-100 bg-emerald-50/80 px-2.5 py-2 sm:block">
          <p className="flex items-start gap-1.5 text-[10px] font-semibold leading-snug text-emerald-800">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" />
            Doctor-approved recovery plan available for you.
          </p>
        </div>
        <p className="text-2xl font-black text-gray-900 sm:text-3xl">{headline.greeting}</p>
        <h1 className="mt-1 max-w-xl text-2xl font-black leading-tight text-gray-900 sm:text-4xl">
          {headline.lead}{' '}
          <span className="text-red-500">{headline.emphasis}</span>
          {headline.conjunction}{' '}
          <span className="text-emerald-500">{headline.hope}</span>
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-gray-500 sm:text-base">{headline.subtext}</p>
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 sm:hidden">
          <ShieldCheck size={14} />
          Doctor-approved recovery plan available
        </p>
      </motion.section>

      <motion.section
        {...fadeUp(0.06)}
        className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
              {possess} deficiency risk score
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <p className="text-4xl font-black tabular-nums leading-none text-red-500 sm:text-5xl">
                {scoreAnimated}
                <span className="text-xl font-bold text-gray-300"> /100</span>
              </p>
              <span className={`mb-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${BADGE[risk.tone]}`}>
                {risk.label}
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-500">{riskSummary(score)}</p>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <ScoreRing score={scoreAnimated} size={148} stroke={14} color={RING_COLOR[risk.tone]} label="/100" />
            <div className="flex flex-col gap-3">
              {chips.map((chip) => {
                const Icon = chip.Icon
                return (
                  <div key={chip.label} className="flex flex-col items-center gap-1">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${CHIP[chip.tone]}`}>
                      <Icon size={16} />
                    </span>
                    <p className="w-16 text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-gray-500">
                      {chip.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {gaps.length > 0 ? (
        <motion.section {...fadeUp(0.1)}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Top nutrient gaps</p>
            {risk.tone === 'high' ? (
              <span className="text-[11px] font-bold text-red-500">(High Risk)</span>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {gaps.map((gap) => (
              <NutrientGapCard key={gap.nutrient} gap={gap} />
            ))}
          </div>
        </motion.section>
      ) : null}

      <motion.section {...fadeUp(0.14)}>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">What this is affecting you</p>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {impacts.map((area) => (
            <ImpactAreaCard key={area.title} area={area} />
          ))}
        </div>
      </motion.section>

      {steps.length > 0 ? (
        <motion.section {...fadeUp(0.18)}>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Your immediate action plan</p>
          <div className="grid gap-3 md:grid-cols-[1.2fr_0.9fr] md:items-stretch">
            <div className="flex flex-col gap-2.5">
              {steps.map((step, i) => (
                <ActionPlanStep key={step.title} step={step} index={i} />
              ))}
            </div>
            <RecoveryTrendCard />
          </div>
        </motion.section>
      ) : (
        <motion.section {...fadeUp(0.18)}>
          <RecoveryTrendCard />
        </motion.section>
      )}
    </div>
  )
}
