'use client'

import { ClipboardList } from 'lucide-react'

type Props = {
  instructions: string[]
  title?: string
  className?: string
  compact?: boolean
}

export function DietPlanInstructionsBox({
  instructions,
  title = 'Plan instructions',
  className = '',
  compact = false,
}: Props) {
  if (instructions.length === 0) return null

  return (
    <div
      className={`rounded-2xl border border-emerald-500/20 bg-[#060910] ${compact ? 'px-4 py-3' : 'px-4 py-4 sm:px-6'} ${className}`}
    >
      <div className="flex items-center gap-2">
        <ClipboardList className="shrink-0 text-emerald-400" size={compact ? 16 : 18} aria-hidden />
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">{title}</p>
      </div>
      <ol className={`${compact ? 'mt-2' : 'mt-3'} space-y-2 pl-5`} style={{ listStyleType: 'decimal' }}>
        {instructions.map((line, idx) => (
          <li key={`${idx}-${line.slice(0, 24)}`} className="text-sm leading-relaxed text-[#8B9AB0]">
            {line}
          </li>
        ))}
      </ol>
    </div>
  )
}
