'use client'

import { Heart } from 'lucide-react'

export function RecoveryTrendCard() {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-emerald-50 px-4 py-4">
      <p className="text-sm font-bold text-gray-900 leading-snug">Recovery is possible with the right plan.</p>
      <svg viewBox="0 0 220 90" className="mt-3 w-full flex-1" aria-hidden>
        <line x1="16" y1="74" x2="204" y2="74" stroke="#D1FAE5" strokeWidth="2" />
        <path
          d="M18 68 C 70 62, 90 48, 118 36 C 150 22, 170 16, 202 10"
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="18" cy="68" r="4" fill="#10B981" />
        <circle cx="118" cy="36" r="4" fill="#10B981" />
        <circle cx="202" cy="10" r="4" fill="#10B981" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        <span>Today</span>
        <span>8 Weeks</span>
        <span>16 Weeks</span>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
        Small steps today, stronger you tomorrow.
        <Heart size={12} className="fill-emerald-500 text-emerald-500" />
      </p>
    </div>
  )
}
