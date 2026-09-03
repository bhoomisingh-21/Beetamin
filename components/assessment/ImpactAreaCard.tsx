'use client'

import type { ImpactVisual } from '@/lib/assessment-results-visuals'

const TONE = {
  high: 'bg-red-500',
  moderate: 'bg-orange-400',
  low: 'bg-emerald-500',
} as const

export function ImpactAreaCard({ area }: { area: ImpactVisual }) {
  const Icon = area.Icon
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white px-3 py-4 text-center shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <Icon size={22} />
      </span>
      <p className="mt-2.5 text-sm font-bold text-gray-900">{area.title}</p>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${i < area.dots ? TONE[area.tone] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-gray-500">{area.caption}</p>
    </div>
  )
}
