'use client'

import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ProgressLogRow } from '@/lib/booking-actions'

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

type Props = {
  logs: ProgressLogRow[]
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

  const ttStyle = {
    background: '#0F1623',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
  }

  return (
    <div className="mt-4 h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#ffffff08" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: '#8B9AB0', fontSize: 9 }} />
          <YAxis domain={['auto', 'auto']} width={36} tick={{ fill: '#8B9AB0', fontSize: 9 }} />
          <Tooltip contentStyle={ttStyle} />
          <Line type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={2} dot={{ r: 2, fill: '#10b981' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
