'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { FoodRow } from '@/lib/food-db-types'
import { formatFoodKcalLabel } from '@/lib/food-db-types'
import { FoodSearchInput } from '@/components/nutritionist-portal/FoodSearchInput'

type Props = {
  disabled?: boolean
}

/** Collapsible food search + custom entry (Section 6). Grid wiring comes in Section 7. */
export function FoodLibraryPanel({ disabled = false }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<FoodRow | null>(null)

  return (
    <div className="border-b border-emerald-100 bg-white px-4 py-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">Food library</span>
        {expanded ? (
          <ChevronUp size={16} className="text-emerald-600" aria-hidden />
        ) : (
          <ChevronDown size={16} className="text-emerald-600" aria-hidden />
        )}
      </button>

      {expanded ? (
        <div className="mt-3 space-y-3">
          <FoodSearchInput
            disabled={disabled}
            onSelect={(food) => setSelected(food)}
            className="max-w-xl"
          />
          {selected ? (
            <p className="text-xs text-slate-600">
              Selected:{' '}
              <span className="font-semibold text-slate-800">{selected.name}</span>
              {' · '}
              <span className="text-emerald-700">{formatFoodKcalLabel(selected)}</span>
              <span className="text-slate-400"> — assign to meal cells in the next step</span>
            </p>
          ) : (
            <p className="text-xs text-slate-500">Search IFCT foods or add your own custom entries.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
