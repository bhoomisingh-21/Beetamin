'use client'

import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ProgressLogRow } from '@/lib/booking-types'

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

type Props = {
  logs: ProgressLogRow[]
}

const GRID_STROKE = '#e2e8f0'
const TICK_FILL = '#64748b'

const ttStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#334155',
}

/** Last seven weight entries (most recent first in input), oldest→newest for chart. */
export function NutritionistWeightSparkline({ logs }: Props) {
  const data = useMemo(() => {
    const withW = logs.filter((l) => l.weight_kg != null).slice(0, 7)
    const asc = [...withW].sort(
      (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
    )
    return asc.map((l) => ({
      date: shortDate(l.logged_at),
      kg: Number(l.weight_kg),
    }))
  }, [logs])

  if (data.length < 2) return null

  return (
    <div className="mt-4 h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: TICK_FILL, fontSize: 9 }} />
          <YAxis domain={['auto', 'auto']} width={36} tick={{ fill: TICK_FILL, fontSize: 9 }} />
          <Tooltip contentStyle={ttStyle} />
          <Line type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={2} dot={{ r: 2, fill: '#10b981' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
