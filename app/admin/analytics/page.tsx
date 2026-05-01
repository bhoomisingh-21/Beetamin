'use client'

import { motion } from 'framer-motion'
import {
  Calendar,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  getAppointmentCountsLast7Days,
  getFunnelMetrics,
  getNutritionistStats,
  getPlatformAnalytics,
  type DayCount,
  type FunnelMetrics,
  type PlatformAnalytics,
} from '@/lib/admin-queries'

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [weekly, setWeekly] = useState<DayCount[]>([])
  const [funnel, setFunnel] = useState<FunnelMetrics | null>(null)
  const [nuts, setNuts] = useState<Awaited<ReturnType<typeof getNutritionistStats>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getPlatformAnalytics(),
      getAppointmentCountsLast7Days(),
      getFunnelMetrics(),
      getNutritionistStats(),
    ])
      .then(([a, w, f, n]) => {
        if (!cancelled) {
          setAnalytics(a)
          setWeekly(w)
          setFunnel(f)
          setNuts(n)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAnalytics(null)
          setWeekly([])
          setFunnel(null)
          setNuts([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const derived = useMemo(() => {
    if (!analytics || !funnel)
      return null as null | {
        topNut: { name: string; total: number }
        peakDay: { label: string; count: number }
        avgPerClient: number
        completionPct: number
      }

    const topNut = nuts.reduce(
      (best, n) => (n.total > best.total ? { name: n.name, total: n.total } : best),
      { name: '—', total: 0 }
    )
    const peak = weekly.length
      ? weekly.reduce((best, d) => (d.count > best.count ? d : best), weekly[0]!)
      : { label: '—', count: 0, date: '' }
    const avgPerClient =
      analytics.totalClients > 0 ? Math.round((analytics.totalSessions / analytics.totalClients) * 10) / 10 : 0
    const completionPct =
      analytics.totalSessions > 0
        ? Math.round((analytics.completedSessions / analytics.totalSessions) * 100)
        : 0

    return {
      topNut,
      peakDay: { label: peak.label, count: peak.count },
      avgPerClient,
      completionPct,
    }
  }, [analytics, weekly, funnel, nuts])

  const maxWeek = Math.max(1, ...weekly.map((d) => d.count))
  const maxFunnel = Math.max(
    1,
    funnel?.assessmentTakers ?? 0,
    funnel?.leadsGenerated ?? 0,
    funnel?.plansPurchased ?? 0
  )

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="font-black text-3xl text-white">Analytics</h1>

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
            { label: 'Total Sessions', value: analytics.totalSessions, icon: Calendar, c: 'text-emerald-400' },
            { label: 'Completed', value: analytics.completedSessions, icon: CheckCircle, c: 'text-emerald-400' },
            { label: 'Upcoming', value: analytics.upcomingSessions, icon: Clock, c: 'text-blue-400' },
            { label: 'Clients', value: analytics.totalClients, icon: Users, c: 'text-purple-400' },
          ].map((x) => (
            <motion.div
              key={x.label}
              variants={cardVariants}
              className="rounded-2xl border border-white/[0.08] bg-[#111820] p-6"
            >
              <x.icon className={x.c} size={22} />
              <p className="mt-3 font-black text-3xl tabular-nums text-white">{x.value}</p>
              <p className="mt-1 text-sm text-gray-400">{x.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      <section className="mt-10">
        <h2 className="font-bold text-xl text-white">Weekly trend</h2>
        <p className="mt-1 text-sm text-gray-500">Appointments scheduled per day (IST, last 7 days)</p>
        {loading ? (
          <div className="mt-6 h-36 animate-pulse rounded-2xl bg-[#1a2535]" />
        ) : (
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#111820] px-6 py-8">
            {weekly.map((d) => (
              <div key={d.date} className="flex flex-col items-center gap-2">
                <div
                  className="flex w-10 items-end justify-center rounded-t-lg bg-emerald-500 transition-all"
                  style={{ height: `${Math.max(8, (d.count / maxWeek) * 120)}px` }}
                  title={`${d.date}: ${d.count}`}
                />
                <span className="text-[11px] font-semibold text-gray-400">{d.label}</span>
                <span className="font-black tabular-nums text-white">{d.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-bold text-xl text-white">Conversion funnel</h2>
        {loading || !funnel ? (
          <div className="mt-4 h-40 animate-pulse rounded-2xl bg-[#1a2535]" />
        ) : (
          <div className="mt-4 space-y-3">
            {[
              { label: 'Assessment Takers', value: funnel.assessmentTakers, color: 'bg-gray-600', width: 1 },
              { label: 'Leads Generated', value: funnel.leadsGenerated, color: 'bg-blue-500', width: 0.72 },
              { label: 'Plans Purchased', value: funnel.plansPurchased, color: 'bg-emerald-500', width: 0.48 },
            ].map((row) => (
              <div key={row.label} className="overflow-hidden rounded-xl bg-[#0d1520]">
                <div
                  className={`flex h-12 min-w-[40%] items-center px-4 text-sm font-medium text-white ${row.color}`}
                  style={{ width: `${Math.max(35, (row.value / maxFunnel) * 100 * row.width)}%` }}
                >
                  <span className="truncate">
                    {row.label} — <strong className="font-black">{row.value}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-bold text-xl text-white">Top stats</h2>
        {loading || !derived ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#1a2535]" />
            ))}
          </div>
        ) : (
          <motion.div
            className="mt-4 grid gap-4 md:grid-cols-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {[
              {
                title: 'Most active nutritionist',
                body: `${derived.topNut.name} — ${derived.topNut.total} sessions`,
                icon: TrendingUp,
              },
              {
                title: 'Peak day (this week)',
                body: `${derived.peakDay.label} — ${derived.peakDay.count} scheduled`,
                icon: Calendar,
              },
              {
                title: 'Avg sessions / client',
                body: String(derived.avgPerClient),
                icon: Users,
              },
              {
                title: 'Completion rate',
                body: `${derived.completionPct}%`,
                icon: Target,
              },
            ].map((x) => (
              <div
                key={x.title}
                className="flex gap-4 rounded-2xl border border-white/[0.08] bg-[#111820] p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0d1520] text-emerald-400">
                  <x.icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{x.title}</p>
                  <p className="mt-1 font-black text-lg text-white">{x.body}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  )
}
