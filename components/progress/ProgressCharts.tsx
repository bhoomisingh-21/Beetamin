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
import {
  cardSubtitle,
  cardTitle,
  profileCard,
  textSecondary,
} from '@/components/profile/profile-dark-styles'

export type ChartRange = '1W' | '1M' | '3M'

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function energyFill(v: number) {
  if (v <= 3) return '#ef4444'
  if (v <= 6) return '#f59e0b'
  return '#10b981'
}

function rangeDays(r: ChartRange): number {
  switch (r) {
    case '1W':
      return 7
    case '1M':
      return 30
    case '3M':
      return 90
    default:
      return 30
  }
}

type Props = {
  progressLogs: ProgressLogRow[]
  range: ChartRange
}

export function ProgressCharts({ progressLogs, range }: Props) {
  const days = rangeDays(range)
  const sortedAsc = useMemo(() => {
    return [...progressLogs].sort(
      (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
    )
  }, [progressLogs])

  const weightData = useMemo(() => {
    const cutoff = Date.now() - days * 86400000
    return sortedAsc
      .filter((l) => l.weight_kg != null && new Date(l.logged_at).getTime() >= cutoff)
      .map((l) => ({
        date: shortDate(l.logged_at),
        kg: Number(l.weight_kg),
      }))
  }, [sortedAsc, days])

  const energyData = useMemo(() => {
    const cutoff = Date.now() - days * 86400000
    return sortedAsc
      .filter(
        (l) =>
          l.energy_level != null && new Date(l.logged_at).getTime() >= cutoff,
      )
      .map((l) => ({
        date: shortDate(l.logged_at),
        energy: Number(l.energy_level),
      }))
  }, [sortedAsc, days])

  const waterData = useMemo(() => {
    const cutoff = Date.now() - days * 86400000
    return sortedAsc
      .filter((l) => new Date(l.logged_at).getTime() >= cutoff)
      .map((l) => ({
        date: shortDate(l.logged_at),
        ml: Math.max(0, Number(l.water_ml ?? 0)),
      }))
  }, [sortedAsc, days])

  const sleepData = useMemo(() => {
    const cutoff = Date.now() - days * 86400000
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
  }, [sortedAsc, days])

  const chartWrap = 'mt-4 h-[200px] w-full md:h-64'

  const rangeLabel =
    range === '1W' ? 'Last 7 days' : range === '1M' ? 'Last 30 days' : 'Last 90 days'

  const ttStyle = {
    background: '#0F1623',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={`${profileCard} p-5 md:p-6`}>
        <h3 className={cardTitle}>Weight</h3>
        <p className={`${cardSubtitle} mt-1`}>{rangeLabel}</p>
        {weightData.length >= 2 ? (
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                <Tooltip contentStyle={ttStyle} labelStyle={{ color: '#F0F4F8' }} />
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
          <p className={`mt-4 text-sm ${textSecondary}`}>Log at least 2 days to see this chart.</p>
        )}
      </div>

      <div className={`${profileCard} p-5 md:p-6`}>
        <h3 className={cardTitle}>Energy</h3>
        <p className={`${cardSubtitle} mt-1`}>{rangeLabel}</p>
        {energyData.length >= 2 ? (
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData}>
                <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="energy" radius={[6, 6, 0, 0]}>
                  {energyData.map((entry, i) => (
                    <Cell key={i} fill={energyFill(entry.energy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className={`mt-4 text-sm ${textSecondary}`}>Log at least 2 days to see this chart.</p>
        )}
      </div>

      <div className={`${profileCard} p-5 md:p-6`}>
        <h3 className={cardTitle}>Water</h3>
        <p className={`${cardSubtitle} mt-1`}>{rangeLabel} · Goal 2000 ml</p>
        {waterData.length >= 2 ? (
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={waterData}>
                <defs>
                  <linearGradient id="waterGradProg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                <Tooltip contentStyle={ttStyle} />
                <ReferenceLine y={2000} stroke="#60a5fa" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="ml"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#waterGradProg2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className={`mt-4 text-sm ${textSecondary}`}>Log at least 2 days to see this chart.</p>
        )}
      </div>

      <div className={`${profileCard} p-5 md:p-6`}>
        <h3 className={cardTitle}>Sleep</h3>
        <p className={`${cardSubtitle} mt-1`}>{rangeLabel} · 8h recommended</p>
        {sleepData.length >= 2 ? (
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepData}>
                <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                <YAxis domain={[0, 12]} tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                <Tooltip contentStyle={ttStyle} />
                <ReferenceLine y={8} stroke="#a78bfa" strokeDasharray="4 4" />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className={`mt-4 text-sm ${textSecondary}`}>Log at least 2 days to see this chart.</p>
        )}
      </div>
    </div>
  )
}
