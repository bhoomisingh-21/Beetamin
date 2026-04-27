'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { type ProgressLogRow } from '@/lib/booking-actions'
import { darkCard, heading, subheading } from './profile-dark-styles'

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function energyFill(v: number) {
  if (v <= 3) return '#ef4444'
  if (v <= 6) return '#eab308'
  return '#10b981'
}

type Props = {
  progressLogs: ProgressLogRow[]
}

export function ProgressCharts({ progressLogs }: Props) {
  const sortedAsc = useMemo(() => {
    return [...progressLogs].sort(
      (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
    )
  }, [progressLogs])

  const weightData = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000
    return sortedAsc
      .filter((l) => l.weight_kg != null && new Date(l.logged_at).getTime() >= cutoff)
      .map((l) => ({
        date: shortDate(l.logged_at),
        iso: l.logged_at,
        kg: Number(l.weight_kg),
      }))
  }, [sortedAsc])

  const energyData = useMemo(() => {
    const cutoff = Date.now() - 14 * 86400000
    return sortedAsc
      .filter(
        (l) =>
          l.energy_level != null &&
          new Date(l.logged_at).getTime() >= cutoff,
      )
      .map((l) => ({
        date: shortDate(l.logged_at),
        energy: Number(l.energy_level),
      }))
  }, [sortedAsc])

  const waterData = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000
    return sortedAsc
      .filter((l) => new Date(l.logged_at).getTime() >= cutoff)
      .map((l) => ({
        date: shortDate(l.logged_at),
        ml: Math.max(0, Number(l.water_ml ?? 0)),
      }))
  }, [sortedAsc])

  const sleepData = useMemo(() => {
    const cutoff = Date.now() - 14 * 86400000
    return sortedAsc
      .filter(
        (l) =>
          l.sleep_hours != null &&
          Number(l.sleep_hours) > 0 &&
          new Date(l.logged_at).getTime() >= cutoff,
      )
      .map((l) => ({
        date: shortDate(l.logged_at),
        hours: Number(l.sleep_hours),
      }))
  }, [sortedAsc])

  const chartWrap = 'mt-4 h-64 w-full'

  return (
    <div className="space-y-10">
      <div className={darkCard}>
        <h3 className={`${heading} text-lg`}>Weight trend</h3>
        <p className={subheading}>Last 30 days</p>
        {weightData.length >= 2 ? (
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid stroke="#ffffff14" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#111820',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Log weight on at least two days to see this chart.</p>
        )}
      </div>

      <div className={darkCard}>
        <h3 className={`${heading} text-lg`}>Energy</h3>
        <p className={subheading}>Last 14 days</p>
        {energyData.length >= 2 ? (
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData}>
                <CartesianGrid stroke="#ffffff14" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#111820',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="energy" radius={[6, 6, 0, 0]}>
                  {energyData.map((entry, i) => (
                    <Cell key={i} fill={energyFill(entry.energy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Log energy on at least two days to see this chart.</p>
        )}
      </div>

      <div className={darkCard}>
        <h3 className={`${heading} text-lg`}>Water</h3>
        <p className={subheading}>Last 7 days · Goal 2000 ml</p>
        {waterData.length >= 2 ? (
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={waterData}>
                <defs>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff14" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#111820',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                  }}
                />
                <ReferenceLine y={2000} stroke="#60a5fa" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="ml"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#waterGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            Track water on at least two days to see this chart.
          </p>
        )}
      </div>

      <div className={darkCard}>
        <h3 className={`${heading} text-lg`}>Sleep</h3>
        <p className={subheading}>Last 14 nights · Recommended 8h</p>
        {sleepData.length >= 2 ? (
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepData}>
                <CartesianGrid stroke="#ffffff14" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis domain={[0, 12]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#111820',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                  }}
                />
                <ReferenceLine y={8} stroke="#a78bfa" strokeDasharray="4 4" />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Log sleep on at least two nights to see this chart.</p>
        )}
      </div>
    </div>
  )
}
