'use client'

import { ScoreRing } from '@/components/assessment/ScoreRing'
import type { NutrientGapVisual } from '@/lib/assessment-results-visuals'

const TONE = {
  critical: { ring: '#EF4444', badge: 'bg-red-500/15 text-red-400' },
  low: { ring: '#F97316', badge: 'bg-orange-500/15 text-orange-400' },
  mild: { ring: '#F59E0B', badge: 'bg-amber-500/15 text-amber-400' },
} as const

export function NutrientGapCard({ gap }: { gap: NutrientGapVisual }) {
  const tone = TONE[gap.levelTone]
  const Icon = gap.Icon

  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-[#111810] px-3 py-4 text-center lg:px-6 lg:py-7">
      <div className="flex items-center gap-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 lg:h-8 lg:w-8">
          {gap.iconLabel ? (
            <span className="text-[10px] font-black">{gap.iconLabel}</span>
          ) : (
            <Icon size={14} />
          )}
        </span>
        <p className="text-sm font-bold text-white leading-tight lg:text-base">{gap.nutrient}</p>
      </div>
      <div className="mt-3 lg:mt-5">
        <ScoreRing score={gap.optimalPct} size={86} stroke={8} color={tone.ring} />
      </div>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 lg:text-xs">
        {gap.optimalPct}% Optimal
      </p>
      <span className={`mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold lg:mt-3 lg:px-3 lg:py-1 lg:text-xs ${tone.badge}`}>
        {gap.levelLabel}
      </span>
      <p className="mt-2 text-[11px] leading-snug text-gray-400 line-clamp-2 lg:mt-3 lg:text-sm lg:line-clamp-3">{gap.reason}</p>
    </div>
  )
}
