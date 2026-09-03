'use client'

import { ChevronRight } from 'lucide-react'
import type { ActionStepVisual } from '@/lib/assessment-results-visuals'

export function ActionPlanStep({ step, index }: { step: ActionStepVisual; index: number }) {
  const Icon = step.Icon
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-3 shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900 leading-snug">
          <span className="mr-1 text-gray-400">{index + 1}.</span>
          {step.title}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 leading-snug line-clamp-2">{step.body}</p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-gray-300" />
    </div>
  )
}
