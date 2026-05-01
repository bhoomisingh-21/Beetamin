'use client'

import { motion } from 'framer-motion'
import {
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  getNutritionistStats,
  getPlatformAnalytics,
  getTodaysAppointmentsAdmin,
  type AdminAppointmentRow,
  type NutritionistWithAppointmentStats,
  type PlatformAnalytics,
} from '@/lib/admin-queries'

function formatDayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const hh = h ?? 0
  const mm = m ?? 0
  return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`
}

function statusBadge(status: string) {
  const s = status.toLowerCase()
  if (s === 'completed')
    return 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
  if (s === 'pending' || s === 'confirmed')
    return 'border border-blue-500/30 bg-blue-500/20 text-blue-400'
  return 'border border-red-500/30 bg-red-500/20 text-red-400'
}

function displayStatus(status: string) {
  if (status === 'confirmed') return 'Scheduled'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function AdminOverviewPage() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [nutritionists, setNutritionists] = useState<NutritionistWithAppointmentStats[]>([])
  const [todayRows, setTodayRows] = useState<AdminAppointmentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getPlatformAnalytics(),
      getNutritionistStats(),
      getTodaysAppointmentsAdmin(),
    ])
      .then(([a, n, t]) => {
        if (!cancelled) {
          setAnalytics(a)
          setNutritionists(n)
          setTodayRows(t)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAnalytics(null)
          setNutritionists([])
          setTodayRows([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const maxTotal = Math.max(0, ...nutritionists.map((n) => n.total))

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-black text-3xl text-white">Admin Overview</h1>
          <p className="text-sm text-gray-400">{formatDayLabel()}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </div>
      </div>

      {loading || !analytics ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#1a2535]" />
          ))}
        </div>
      ) : (
        <motion.div
          className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {[
            {
              label: 'Total Sessions',
              value: analytics.totalSessions,
              icon: Calendar,
              iconClass: 'text-emerald-400',
            },
            {
              label: 'Completed',
              value: analytics.completedSessions,
              icon: CheckCircle,
              iconClass: 'text-emerald-400',
            },
            {
              label: 'Upcoming',
              value: analytics.upcomingSessions,
              icon: Clock,
              iconClass: 'text-blue-400',
            },
            {
              label: 'Total Clients',
              value: analytics.totalClients,
              icon: Users,
              iconClass: 'text-purple-400',
            },
          ].map((c) => (
            <motion.div
              key={c.label}
              variants={cardVariants}
              transition={{ duration: 0.35 }}
              className="rounded-2xl border border-white/[0.08] bg-[#111820] p-6"
            >
              <c.icon className={c.iconClass} size={22} />
              <p className="mt-3 font-black text-4xl tabular-nums text-white">{c.value}</p>
              <p className="mt-1 text-sm text-gray-400">{c.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {loading || !analytics ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#1a2535]" />
          ))}
        </div>
      ) : (
        <motion.div
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }}
        >
          {[
            {
              label: "Today's Sessions",
              value: analytics.todaySessions,
              icon: CalendarDays,
              iconClass: 'text-amber-400',
            },
            {
              label: 'This Week',
              value: analytics.weekSessions,
              icon: TrendingUp,
              iconClass: 'text-emerald-400',
            },
            {
              label: 'Total Leads',
              value: analytics.totalLeads,
              icon: Target,
              iconClass: 'text-pink-400',
            },
          ].map((c) => (
            <motion.div
              key={c.label}
              variants={cardVariants}
              transition={{ duration: 0.35 }}
              className="rounded-2xl border border-white/[0.08] bg-[#111820] p-6"
            >
              <c.icon className={c.iconClass} size={22} />
              <p className="mt-3 font-black text-3xl tabular-nums text-white">{c.value}</p>
              <p className="mt-1 text-sm text-gray-400">{c.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      <section className="mt-10">
        <h2 className="font-bold text-xl text-white">Nutritionist Performance</h2>
        {loading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-[#1a2535]" />
            ))}
          </div>
        ) : nutritionists.length === 0 ? (
          <p className="mt-6 text-center text-gray-500">No nutritionists yet 📋</p>
        ) : (
          <motion.div
            className="mt-4 grid gap-4 md:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {nutritionists.map((n) => {
              const pct = n.total > 0 ? Math.round((n.completed / n.total) * 100) : 0
              const mostActive = n.total > 0 && n.total === maxTotal
              return (
                <motion.div
                  key={n.id}
                  variants={cardVariants}
                  className="rounded-2xl border border-white/[0.08] bg-[#111820] p-6"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-lg text-white">{n.name}</p>
                      <p className="truncate text-sm text-gray-400">{n.email}</p>
                    </div>
                    {mostActive ? (
                      <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-black">
                        Most Active
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'Total', value: n.total, color: 'text-white' },
                      { label: 'Done', value: n.completed, color: 'text-emerald-400' },
                      { label: 'Pending', value: n.upcoming, color: 'text-blue-400' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-[#0d1520] px-2 py-3">
                        <p className={`font-black text-2xl tabular-nums ${s.color}`}>{s.value}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-400">Completion rate {pct}%</p>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#0d1520]">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-bold text-xl text-white">Today&apos;s Schedule</h2>
        {loading ? (
          <div className="mt-4 h-40 animate-pulse rounded-2xl bg-[#1a2535]" />
        ) : todayRows.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#111820] py-16 text-center text-gray-500">
            Nothing on the calendar today 🗓️
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111820]">
            <table className="hidden min-w-full md:table">
              <thead>
                <tr className="border-b border-white/5 bg-[#0d1520] text-left text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Nutritionist</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayRows.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-semibold text-white">{row.clients?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-300">{formatTime(row.scheduled_time)}</td>
                    <td className="px-6 py-4 text-gray-300">{row.nutritionists?.name ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadge(row.status)}`}
                      >
                        {displayStatus(row.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-white/5 md:hidden">
              {todayRows.map((row) => (
                <li key={row.id} className="px-4 py-4">
                  <p className="font-semibold text-white">{row.clients?.name ?? '—'}</p>
                  <p className="text-sm text-gray-400">{formatTime(row.scheduled_time)}</p>
                  <p className="mt-1 text-xs text-gray-500">{row.nutritionists?.name ?? '—'}</p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadge(row.status)}`}
                  >
                    {displayStatus(row.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
