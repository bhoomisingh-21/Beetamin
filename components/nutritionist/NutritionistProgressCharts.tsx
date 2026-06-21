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
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ProgressLogRow } from '@/lib/booking-types'
import { portal } from '@/components/nutritionist-portal/portal-theme'

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
  clientName: string
}

const card = `${portal.card} p-5`
const subtitle = `text-xs ${portal.textMuted}`
const title = `text-[15px] font-semibold ${portal.textH}`
const chartH = 'mt-4 h-[180px] w-full md:h-52'

const GRID_STROKE = '#e2e8f0'
const TICK_FILL = '#64748b'
const REF_LINE_STROKE = '#cbd5e1'

const ttStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#334155',
}

export function NutritionistProgressCharts({
  logs,
  latestWeight,
  currentBmi,
  avgEnergy7,
  avgSleep7,
  clientName,
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

  const needTwo = `${clientName} needs to log at least 2 days to show this chart`

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={card}>
          <p className={subtitle}>Latest weight</p>
          <p className={`mt-2 text-xl font-black tabular-nums ${portal.textAccent}`}>
            {latestWeight != null ? `${latestWeight.toFixed(1)} kg` : '—'}
          </p>
        </div>
        <div className={card}>
          <p className={subtitle}>Current BMI</p>
          <p className={`mt-2 text-xl font-black tabular-nums ${portal.textH}`}>
            {currentBmi != null ? currentBmi.toFixed(1) : '—'}
          </p>
        </div>
        <div className={card}>
          <p className={subtitle}>Avg energy (7d)</p>
          <p className="mt-2 text-xl font-black tabular-nums text-amber-600">
            {avgEnergy7 != null ? avgEnergy7.toFixed(1) + '/10' : '—'}
          </p>
        </div>
        <div className={card}>
          <p className={subtitle}>Avg sleep (7d)</p>
          <p className="mt-2 text-xl font-black tabular-nums text-purple-600">
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
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: TICK_FILL, fontSize: 11 }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: TICK_FILL, fontSize: 11 }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Line type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`mt-4 text-sm ${subtitle}`}>{needTwo}</p>
          )}
        </div>

        <div className={card}>
          <h3 className={title}>Energy</h3>
          <p className={`${subtitle} mt-1`}>Last 14 days</p>
          {energy14.length >= 2 ? (
            <div className={chartH}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={energy14}>
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: TICK_FILL, fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: TICK_FILL, fontSize: 11 }} />
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
            <p className={`mt-4 text-sm ${subtitle}`}>{needTwo}</p>
          )}
        </div>

        <div className={card}>
          <h3 className={title}>Water</h3>
          <p className={`${subtitle} mt-1`}>Last 7 days</p>
          {water7.length >= 2 ? (
            <div className={chartH}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={water7}>
                  <defs>
                    <linearGradient id="nwNut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: TICK_FILL, fontSize: 11 }} />
                  <YAxis tick={{ fill: TICK_FILL, fontSize: 11 }} />
                  <Tooltip contentStyle={ttStyle} />
                  <ReferenceLine y={2000} stroke={REF_LINE_STROKE} strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="ml"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#nwNut)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`mt-4 text-sm ${subtitle}`}>{needTwo}</p>
          )}
        </div>

        <div className={card}>
          <h3 className={title}>Sleep</h3>
          <p className={`${subtitle} mt-1`}>Last 14 days</p>
          {sleep14.length >= 2 ? (
            <div className={chartH}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleep14}>
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: TICK_FILL, fontSize: 11 }} />
                  <YAxis domain={[0, 12]} tick={{ fill: TICK_FILL, fontSize: 11 }} />
                  <Tooltip contentStyle={ttStyle} />
                  <ReferenceLine y={8} stroke={REF_LINE_STROKE} strokeDasharray="4 4" />
                  <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={`mt-4 text-sm ${subtitle}`}>{needTwo}</p>
          )}
        </div>
      </div>
    </>
  )
}
