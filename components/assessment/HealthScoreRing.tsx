'use client'

import { ScoreRing } from '@/components/assessment/ScoreRing'

/** Dark-surface ring used on older snapshot screens. */
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
  return <ScoreRing score={score} size={size} stroke={stroke} color={color} track="rgba(255,255,255,0.08)" />
}
