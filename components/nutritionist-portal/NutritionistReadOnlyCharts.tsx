'use client'

import { useMemo, useRef } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ProgressLogRow } from '@/lib/booking-actions'

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

type Props = {
  logs: ProgressLogRow[]
  latestWeight: number | null
  currentBmi: number | null
  avgEnergy7: number | null
  avgSleep7: number | null
}

const card =
  'rounded-2xl border border-white/[0.06] bg-[#0F1623] p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.05),0_4px_24px_rgba(0,0,0,0.4)]'
const subtitle = 'text-xs text-[#8B9AB0]'
const title = 'text-[15px] font-semibold text-[#F0F4F8]'
const chartH = 'mt-4 h-[180px] w-full md:h-52'

export function NutritionistReadOnlyCharts({
  logs,
  latestWeight,
  currentBmi,
  avgEnergy7,
  avgSleep7,
}: Props) {
  const anchorMs = useRef(0)
  if (anchorMs.current === 0) {
    // eslint-disable-next-line react-hooks/purity -- chart range anchored once per mount
    anchorMs.current = Date.now()
  }
  const now = anchorMs.current

  const sortedAsc = useMemo(() => {
    return [...logs].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
  }, [logs])

  const weight30 = useMemo(() => {
    const cutoff = now - 30 * 86400000
    return sortedAsc
      .filter((l) => l.weight_kg != null && new Date(l.logged_at).getTime() >= cutoff)
      .map((l) => ({ date: shortDate(l.logged_at), kg: Number(l.weight_kg) }))
  }, [sortedAsc, now])

  const energy14 = useMemo(() => {
    const cutoff = now - 14 * 86400000
    return sortedAsc
      .filter((l) => l.energy_level != null && new Date(l.logged_at).getTime() >= cutoff)
      .map((l) => ({ date: shortDate(l.logged_at), energy: Number(l.energy_level) }))
  }, [sortedAsc, now])

  const water7 = useMemo(() => {
    const cutoff = now - 7 * 86400000
    return sortedAsc
      .filter((l) => new Date(l.logged_at).getTime() >= cutoff)
      .map((l) => ({
        date: shortDate(l.logged_at),
        ml: Math.max(0, Number(l.water_ml ?? 0)),
      }))
  }, [sortedAsc, now])

  const sleep14 = useMemo(() => {
    const cutoff = now - 14 * 86400000
    return sortedAsc
      .filter(
        (l) =>
          l.sleep_hours != null &&
          Number(l.sleep_hours) > 0 &&
          new Date(l.logged_at).getTime() >= cutoff,
      )
      .map((l) => ({ date: shortDate(l.logged_at), hours: Number(l.sleep_hours) }))
  }, [sortedAsc, now])

  const ttStyle = {
    background: '#0F1623',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
  }

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={card}>
          <p className={subtitle}>Latest weight</p>
          <p className="mt-2 text-xl font-black tabular-nums text-emerald-400">
            {latestWeight != null ? `${latestWeight.toFixed(1)} kg` : '—'}
          </p>
        </div>
        <div className={card}>
          <p className={subtitle}>Current BMI</p>
          <p className="mt-2 text-xl font-black tabular-nums text-[#F0F4F8]">
            {currentBmi != null ? currentBmi.toFixed(1) : '—'}
          </p>
        </div>
        <div className={card}>
          <p className={subtitle}>Avg energy (7d)</p>
          <p className="mt-2 text-xl font-black tabular-nums text-amber-400">
            {avgEnergy7 != null ? avgEnergy7.toFixed(1) + '/10' : '—'}
          </p>
        </div>
        <div className={card}>
          <p className={subtitle}>Avg sleep (7d)</p>
          <p className="mt-2 text-xl font-black tabular-nums text-purple-400">
            {avgSleep7 != null ? `${avgSleep7.toFixed(1)} h` : '—'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <h3 className={title}>Weight</h3>
          <p className={`${subtitle} mt-1`}>Last 30 days</p>
          {weight30.length >= 2 ? (
            <div className={chartH}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weight30}>
                  <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Line type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`mt-4 text-sm ${subtitle}`}>Need more weight logs.</p>
          )}
        </div>

        <div className={card}>
          <h3 className={title}>Energy</h3>
          <p className={`${subtitle} mt-1`}>Last 14 days</p>
          {energy14.length >= 1 ? (
            <div className={chartH}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={energy14}>
                  <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Bar dataKey="energy" radius={[6, 6, 0, 0]}>
                    {energy14.map((e, i) => (
                      <Cell key={i} fill={energyFill(e.energy)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`mt-4 text-sm ${subtitle}`}>No energy data.</p>
          )}
        </div>

        <div className={card}>
          <h3 className={title}>Water</h3>
          <p className={`${subtitle} mt-1`}>Last 7 days</p>
          {water7.length >= 1 ? (
            <div className={chartH}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={water7}>
                  <defs>
                    <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Area
                    type="monotone"
                    dataKey="ml"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#nw)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`mt-4 text-sm ${subtitle}`}>No water data.</p>
          )}
        </div>

        <div className={card}>
          <h3 className={title}>Sleep</h3>
          <p className={`${subtitle} mt-1`}>Last 14 days</p>
          {sleep14.length >= 1 ? (
            <div className={chartH}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleep14}>
                  <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                  <YAxis domain={[0, 12]} tick={{ fill: '#8B9AB0', fontSize: 11 }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Bar dataKey="hours" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`mt-4 text-sm ${subtitle}`}>No sleep data.</p>
          )}
        </div>
      </div>
    </>
  )
}
