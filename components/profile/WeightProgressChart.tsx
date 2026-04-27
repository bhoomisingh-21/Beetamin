'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type WeightChartPoint = { date: string; label: string; kg: number }

type Props = {
  data: WeightChartPoint[]
}

const STROKE = '#10b981'

export function WeightProgressChart({ data }: Props) {
  if (data.length < 2) return null
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip />
          <Line type="monotone" dataKey="kg" stroke={STROKE} strokeWidth={2} dot={{ fill: STROKE }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
