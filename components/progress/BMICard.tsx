'use client'

import { useMemo } from 'react'
import { type ClientRow, type ProgressLogRow } from '@/lib/booking-actions'
import { darkCardSm } from '@/components/profile/profile-dark-styles'

type Props = {
  client: ClientRow | null
  progressLogs: ProgressLogRow[]
}

function idealWeightRangeKg(heightCm: number): { min: number; max: number } {
  const h = heightCm / 100
  return {
    min: Math.round(18.5 * h * h * 10) / 10,
    max: Math.round(24.9 * h * h * 10) / 10,
  }
}

export function BMICard({ client, progressLogs }: Props) {
  const latestWeight = useMemo(() => {
    const withW = progressLogs.filter((l) => l.weight_kg != null)
    if (!withW.length) return null
    return withW.reduce((a, b) => (new Date(a.logged_at) > new Date(b.logged_at) ? a : b))
  }, [progressLogs])

  const heightCm = client?.height_cm != null ? Number(client.height_cm) : null
  const w = latestWeight?.weight_kg != null ? Number(latestWeight.weight_kg) : null

  const bmi =
    w != null && heightCm != null && heightCm > 0 ? w / Math.pow(heightCm / 100, 2) : null

  const category =
    bmi == null
      ? null
      : bmi < 18.5
        ? {
            label: 'Underweight',
            card: 'border-blue-500/30 bg-blue-500/10',
            accent: 'text-blue-300',
          }
        : bmi < 25
          ? {
              label: 'Healthy',
              card: 'border-emerald-500/35 bg-emerald-500/10',
              accent: 'text-emerald-400',
            }
          : bmi < 30
            ? {
                label: 'Overweight',
                card: 'border-orange-500/35 bg-orange-500/10',
                accent: 'text-orange-300',
              }
            : {
                label: 'Obese',
                card: 'border-red-500/35 bg-red-500/10',
                accent: 'text-red-400',
              }

  const ideal = heightCm != null && heightCm > 0 ? idealWeightRangeKg(heightCm) : null

  return (
    <div className={`${darkCardSm} ${bmi != null ? category?.card ?? 'border-white/10' : 'border-white/10'}`}>
      <h3 className="text-lg font-black text-white">BMI</h3>
      {bmi == null ? (
        <p className="mt-4 text-sm text-gray-500">Log weight + height to see BMI.</p>
      ) : (
        <>
          <p className={`mt-4 text-5xl font-black tabular-nums ${category?.accent}`}>
            {bmi.toFixed(1)}
          </p>
          <p className={`mt-2 text-lg font-bold ${category?.accent}`}>{category?.label}</p>
          {ideal && (
            <p className="mt-4 text-xs leading-relaxed text-gray-500">
              Ideal weight range for your height:{' '}
              <span className="font-semibold text-gray-300">
                {ideal.min}–{ideal.max} kg
              </span>
            </p>
          )}
        </>
      )}
    </div>
  )
}
