'use client'

import { motion } from 'framer-motion'

export function HealthScoreRing({
  score,
  size = 168,
  stroke = 12,
  color,
}: {
  score: number
  size?: number
  stroke?: number
  color: string
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tabular-nums leading-none" style={{ color }}>
          {clamped}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">/ 100</span>
      </div>
    </div>
  )
}
