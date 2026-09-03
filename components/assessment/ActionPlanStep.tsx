'use client'

import { ChevronRight } from 'lucide-react'
import type { ActionStepVisual } from '@/lib/assessment-results-visuals'

export function ActionPlanStep({ step, index }: { step: ActionStepVisual; index: number }) {
  const Icon = step.Icon
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#111810] px-3 py-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white leading-snug">
          <span className="mr-1 text-gray-500">{index + 1}.</span>
          {step.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-400 leading-snug line-clamp-2">{step.body}</p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-white/20" />
    </div>
  )
}
