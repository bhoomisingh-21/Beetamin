'use client'

import { ScoreRing } from '@/components/assessment/ScoreRing'
import type { NutrientGapVisual } from '@/lib/assessment-results-visuals'

const TONE = {
  critical: { ring: '#EF4444', badge: 'bg-red-50 text-red-600' },
  low: { ring: '#F97316', badge: 'bg-orange-50 text-orange-600' },
  mild: { ring: '#F59E0B', badge: 'bg-amber-50 text-amber-700' },
} as const

export function NutrientGapCard({ gap }: { gap: NutrientGapVisual }) {
  const tone = TONE[gap.levelTone]
  const Icon = gap.Icon

  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white px-3 py-4 text-center shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          {gap.iconLabel ? (
            <span className="text-[10px] font-black">{gap.iconLabel}</span>
          ) : (
            <Icon size={14} />
          )}
        </span>
        <p className="text-sm font-bold text-gray-900 leading-tight">{gap.nutrient}</p>
      </div>
      <div className="mt-3">
        <ScoreRing score={gap.optimalPct} size={86} stroke={8} color={tone.ring} />
      </div>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {gap.optimalPct}% Optimal
      </p>
      <span className={`mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tone.badge}`}>
        {gap.levelLabel}
      </span>
      <p className="mt-2 text-[11px] leading-snug text-gray-500 line-clamp-2">{gap.reason}</p>
    </div>
  )
}
