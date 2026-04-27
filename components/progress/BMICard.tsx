'use client'

import { useMemo } from 'react'
import { type ClientRow, type ProgressLogRow } from '@/lib/booking-actions'
import { cardSubtitle, cardTitle, profileCard, textSecondary } from '@/components/profile/profile-dark-styles'

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
            ring: 'border-blue-400 shadow-[0_0_40px_rgba(96,165,250,0.25)]',
            accent: 'text-blue-300',
          }
        : bmi < 25
          ? {
              label: 'Healthy',
              ring: 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.25)]',
              accent: 'text-emerald-400',
            }
          : bmi < 30
            ? {
                label: 'Overweight',
                ring: 'border-orange-400 shadow-[0_0_40px_rgba(251,146,60,0.2)]',
                accent: 'text-orange-300',
              }
            : {
                label: 'Obese',
                ring: 'border-red-400 shadow-[0_0_40px_rgba(248,113,113,0.25)]',
                accent: 'text-red-400',
              }

  const ideal = heightCm != null && heightCm > 0 ? idealWeightRangeKg(heightCm) : null

  return (
    <div className={`${profileCard} p-5`}>
      <h3 className={cardTitle}>BMI</h3>
      <p className={`${cardSubtitle} mt-1`}>Based on latest weight & height</p>

      {bmi == null ? (
        <p className={`mt-8 text-sm ${textSecondary}`}>Log weight + height to see BMI.</p>
      ) : (
        <div className="mt-8 flex flex-col items-center">
          <div
            className={`flex h-44 w-44 items-center justify-center rounded-full border-4 bg-[#060910] transition-all duration-500 ${category?.ring ?? ''}`}
          >
            <div className="text-center">
              <p className={`text-5xl font-black tabular-nums ${category?.accent}`}>{bmi.toFixed(1)}</p>
              <p className={`mt-2 text-sm font-bold ${category?.accent}`}>{category?.label}</p>
            </div>
          </div>
          {ideal && (
            <p className={`mt-6 max-w-xs text-center text-xs leading-relaxed ${textSecondary}`}>
              Ideal weight range:{' '}
              <span className="font-semibold text-[#F0F4F8]">
                {ideal.min}–{ideal.max} kg
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
