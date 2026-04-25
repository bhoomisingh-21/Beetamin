'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Leaf,
  Loader2,
  Lock,
  Plus,
  User,
} from 'lucide-react'
import Footer from '@/components/sections/Footer'
import {
  getDashboardBundle,
  upsertProgressLog,
  updateClientProfile,
  type AppointmentRow,
  type ClientRow,
} from '@/lib/booking-actions'

type TabId = 'overview' | 'reports' | 'sessions' | 'progress'

function parseDeficiencyCards(raw: unknown): { nutrient: string; severity: string; reason: string }[] {
  if (!raw || !Array.isArray(raw)) return []
  const out: { nutrient: string; severity: string; reason: string }[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    out.push({
      nutrient: String(o.nutrient ?? ''),
      severity: String(o.severity ?? 'low'),
      reason: String(o.reason ?? ''),
    })
  }
  return out.filter((x) => x.nutrient)
}

function severityBadge(sev: string) {
  if (sev === 'high') return 'bg-red-500/15 text-red-600 border border-red-500/25'
  if (sev === 'medium') return 'bg-amber-500/15 text-amber-700 border border-amber-500/25'
  return 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/25'
}

function daysInPlan(client: ClientRow | null): number {
  if (!client) return 0
  const start = new Date(client.plan_start_date).getTime()
  const end = Math.min(Date.now(), new Date(client.plan_end_date).getTime())
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.max(0, Math.ceil((end - start) / 86400000))
}

function sessionBookable(
  n: number,
  client: ClientRow,
  appointments: AppointmentRow[],
  activeAppt: AppointmentRow | undefined,
): boolean {
  if (client.status !== 'active' || client.sessions_remaining <= 0) return false
  if (activeAppt) return false
  const prevDone =
    n === 1 ||
    !!appointments.find((a) => a.session_number === n - 1 && a.status === 'completed')
  return prevDone && n === client.sessions_used + 1
}

function SessionCircles({
  client,
  appointments,
}: {
  client: ClientRow
  appointments: AppointmentRow[]
}) {
  const router = useRouter()
  const activeAppt = appointments.find((a) => a.status === 'pending' || a.status === 'confirmed')
  const prevSessionCompleted = (n: number) =>
    n === 1 ||
    !!appointments.find((a) => a.session_number === n - 1 && a.status === 'completed')

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
      {[1, 2, 3, 4, 5, 6].map((n) => {
        const appt = appointments.find((a) => a.session_number === n)
        if (appt?.status === 'completed') {
          return (
            <div key={n} className="bg-emerald-500 rounded-2xl p-3 md:p-4 text-center">
              <CheckCircle className="text-black mx-auto" size={22} />
              <p className="text-black font-bold text-xs md:text-sm mt-1">Session {n}</p>
              <p className="text-black/70 text-[10px] md:text-xs mt-0.5">
                {new Date(appt.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          )
        }
        if (appt?.status === 'confirmed') {
          return (
            <div key={n} className="bg-blue-500/20 border-2 border-blue-500 rounded-2xl p-3 md:p-4 text-center">
              <Calendar className="text-blue-400 mx-auto" size={22} />
              <p className="text-blue-300 font-bold text-xs md:text-sm mt-1">Session {n}</p>
              <p className="text-blue-400 text-[10px] md:text-xs mt-0.5">Confirmed</p>
            </div>
          )
        }
        if (appt?.status === 'pending') {
          return (
            <div key={n} className="bg-amber-500/20 border-2 border-amber-500 rounded-2xl p-3 md:p-4 text-center">
              <Clock className="text-amber-400 mx-auto" size={22} />
              <p className="text-amber-300 font-bold text-xs md:text-sm mt-1">Session {n}</p>
              <p className="text-amber-400 text-[10px] md:text-xs mt-0.5">Pending</p>
            </div>
          )
        }
        if (sessionBookable(n, client, appointments, activeAppt)) {
          return (
            <button
              key={n}
              type="button"
              onClick={() => router.push('/booking/new')}
              className="bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl p-3 md:p-4 text-center cursor-pointer hover:bg-emerald-500/20 transition w-full"
            >
              <Calendar className="text-emerald-400 mx-auto" size={22} />
              <p className="text-emerald-300 font-bold text-xs md:text-sm mt-1">Session {n}</p>
              <p className="text-emerald-400 text-[10px] md:text-xs mt-0.5">Book now</p>
            </button>
          )
        }
        const lockHint =
          n > 1 && !prevSessionCompleted(n) ? `Complete session ${n - 1} first` : 'Locked'
        return (
          <div key={n} className="bg-stone-100 border border-stone-200 rounded-2xl p-3 md:p-4 text-center opacity-80">
            <Lock className="text-stone-400 mx-auto" size={22} />
            <p className="text-stone-500 font-bold text-xs md:text-sm mt-1">Session {n}</p>
            <p className="text-stone-500 text-[9px] leading-tight mt-0.5">{lockHint}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(true)
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof getDashboardBundle>> | null>(null)
  const [expandedReport, setExpandedReport] = useState<string | null>(null)

  const [weightKg, setWeightKg] = useState('')
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [energy, setEnergy] = useState(5)
  const [notes, setNotes] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [logSaving, setLogSaving] = useState(false)
  const [logMsg, setLogMsg] = useState('')

  const reload = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const b = await getDashboardBundle(user.id)
      setBundle(b)
      if (b.client?.height_cm) setHeightCm(String(b.client.height_cm))
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      router.replace('/sign-in?after=' + encodeURIComponent('/dashboard'))
      return
    }
    void reload()
  }, [isLoaded, user, router, reload])

  const latestDeficiencies = useMemo(() => {
    const r = bundle?.latestReadyReport
    if (!r?.deficiency_summary) return []
    return parseDeficiencyCards(r.deficiency_summary)
  }, [bundle?.latestReadyReport])

  const weightChartData = useMemo(() => {
    const logs = bundle?.progressLogs || []
    return logs
      .filter((l) => l.weight_kg != null)
      .map((l) => ({
        date: l.logged_at.slice(5),
        kg: Number(l.weight_kg),
      }))
  }, [bundle?.progressLogs])

  const energyChartData = useMemo(() => {
    const logs = [...(bundle?.progressLogs || [])].sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime(),
    )
    const last7 = logs.slice(0, 7).reverse()
    return last7.map((l) => ({
      day: l.logged_at.slice(5),
      energy: l.energy_level ?? 0,
    }))
  }, [bundle?.progressLogs])

  const latestWeight = useMemo(() => {
    const withW = (bundle?.progressLogs || []).filter((l) => l.weight_kg != null)
    if (!withW.length) return null
    const last = withW.reduce((a, b) =>
      new Date(a.logged_at) > new Date(b.logged_at) ? a : b,
    )
    return Number(last.weight_kg)
  }, [bundle?.progressLogs])

  const heightNum = parseFloat(heightCm)
  const bmiDisplay =
    latestWeight != null && heightNum > 0
      ? (latestWeight / Math.pow(heightNum / 100, 2)).toFixed(1)
      : null

  async function handleLogProgress() {
    if (!user?.id) return
    setLogSaving(true)
    setLogMsg('')
    try {
      const w = weightKg.trim() === '' ? null : parseFloat(weightKg)
      if (w != null && (Number.isNaN(w) || w < 20 || w > 300)) {
        setLogMsg('Enter a realistic weight in kg.')
        return
      }
      await upsertProgressLog({
        clerkUserId: user.id,
        weight_kg: w,
        energy_level: energy,
        notes: notes.trim() || null,
        logged_at: logDate,
        height_cm: heightCm.trim() === '' ? null : parseFloat(heightCm),
      })
      if (heightCm.trim() !== '') {
        await updateClientProfile(user.id, { height_cm: parseFloat(heightCm) })
      }
      setWeightKg('')
      setNotes('')
      setLogMsg('Saved.')
      await reload()
    } catch (e) {
      setLogMsg(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setLogSaving(false)
    }
  }

  if (!isLoaded || loading || !bundle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f7f4]">
        <Loader2 className="h-10 w-10 animate-spin text-[#1a472a]" />
      </div>
    )
  }

  const { client, appointments, paidReports, latestReadyReport, assessmentDates } = bundle
  const planBadge = !client
    ? { label: 'No plan', cls: 'bg-stone-200 text-stone-700' }
    : client.status === 'active'
      ? { label: 'Active', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' }
      : client.status === 'expired'
        ? { label: 'Expired', cls: 'bg-red-100 text-red-800 border border-red-200' }
        : { label: 'Completed', cls: 'bg-blue-100 text-blue-900 border border-blue-200' }

  const activeAppt = appointments.find((a) => a.status === 'pending' || a.status === 'confirmed')
  const planComplete =
    client &&
    (client.status === 'completed' ||
      (client.sessions_total > 0 && client.sessions_used >= client.sessions_total))
  const canBookNext =
    client &&
    sessionBookable(client.sessions_used + 1, client, appointments, activeAppt) &&
    !planComplete

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: 'My Reports' },
    { id: 'sessions', label: 'My Sessions' },
    { id: 'progress', label: 'Progress' },
  ]

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-stone-900">
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-20 border-b border-stone-200/90 bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-stone-900">
            <Leaf className="text-emerald-600" size={20} />
            TheBeetamin
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/booking/profile"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              <User size={16} />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <Link
              href="/booking/dashboard"
              className="rounded-xl bg-[#0A0F14] px-3 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Sessions
            </Link>
          </div>
        </div>
      </motion.header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="mb-8 flex flex-wrap gap-2 border-b border-stone-200 pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-t-lg px-4 py-2 text-sm font-bold transition ${
                tab === t.id
                  ? 'bg-white text-[#1a472a] shadow-sm ring-1 ring-stone-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div
              key="ov"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-8"
            >
              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-black text-stone-900">
                    Welcome{user?.firstName ? `, ${user.firstName}` : ''}
                  </h1>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${planBadge.cls}`}>
                    {planBadge.label}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-600">
                  {user?.primaryEmailAddress?.emailAddress || '—'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Sessions used', value: client ? String(client.sessions_used) : '—' },
                  { label: 'Sessions remaining', value: client ? String(client.sessions_remaining) : '—' },
                  {
                    label: 'Reports generated',
                    value: String(paidReports.filter((p) => p.status === 'ready' || p.status === 'generated').length),
                  },
                  { label: 'Days in plan', value: client ? String(daysInPlan(client)) : '—' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{s.label}</p>
                    <p className="mt-2 text-2xl font-black text-[#1a472a]">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
                <h2 className="text-lg font-bold text-stone-900">Your Latest Deficiency Profile</h2>
                {latestDeficiencies.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {latestDeficiencies.map((d) => (
                      <div
                        key={d.nutrient}
                        className="rounded-2xl border border-stone-100 bg-stone-50/80 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-stone-900">{d.nutrient}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${severityBadge(d.severity)}`}>
                            {d.severity}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-stone-600">{d.reason}</p>
                      </div>
                    ))}
                  </div>
                ) : !latestReadyReport ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center">
                    <p className="text-sm text-stone-600">
                      Complete your free assessment to see your deficiency profile, then unlock your paid PDF report.
                    </p>
                    <Link
                      href="/assessment"
                      className="mt-4 inline-flex rounded-xl bg-[#1a472a] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#143622]"
                    >
                      Take free assessment
                    </Link>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-stone-500">
                    Your latest report doesn&apos;t have deficiency details stored yet. Open My Reports to expand a
                    report, or download the PDF.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {canBookNext && (
                  <Link
                    href="/booking/new"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1a472a] px-6 py-4 text-center text-sm font-bold text-white shadow-md hover:bg-[#143622]"
                  >
                    <Plus size={18} />
                    Book Next Session
                  </Link>
                )}
                {latestReadyReport && (
                  <Link
                    href={`/report/${encodeURIComponent(latestReadyReport.report_id)}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-[#1a472a]/30 bg-white px-6 py-4 text-center text-sm font-bold text-[#1a472a] hover:bg-emerald-50"
                  >
                    View Latest Report
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'reports' && (
            <motion.div
              key="rep"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              {paidReports.length === 0 ? (
                <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
                  <p className="text-stone-600">No paid reports yet.</p>
                  <Link
                    href="/assessment"
                    className="mt-6 inline-flex rounded-xl bg-[#1a472a] px-6 py-3 text-sm font-bold text-white"
                  >
                    Take free assessment
                  </Link>
                </div>
              ) : (
                paidReports.map((r) => {
                  const expanded = expandedReport === r.report_id
                  const cards = parseDeficiencyCards(r.deficiency_summary)
                  const assessDate = r.assessment_id ? assessmentDates[r.assessment_id] : null
                  return (
                    <div
                      key={r.report_id}
                      className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedReport(expanded ? null : r.report_id)}
                        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-stone-50"
                      >
                        <div>
                          <p className="font-bold text-stone-900">
                            Report ·{' '}
                            {r.created_at
                              ? new Date(r.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : r.report_id}
                          </p>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Assessment:{' '}
                            {assessDate
                              ? new Date(assessDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}{' '}
                            · Status: <span className="font-semibold capitalize">{r.status}</span>
                          </p>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`shrink-0 text-stone-400 transition ${expanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <div className="flex flex-wrap gap-2 border-t border-stone-100 px-5 py-3">
                        <a
                          href={`/api/download-report?reportId=${encodeURIComponent(r.report_id)}&disposition=attachment`}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          Download
                        </a>
                        <Link
                          href={`/report/${encodeURIComponent(r.report_id)}`}
                          className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-bold text-stone-800 hover:bg-stone-50"
                        >
                          View Report
                        </Link>
                      </div>
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-stone-100 bg-stone-50/80 px-5 py-4"
                          >
                            <p className="text-xs font-bold uppercase text-stone-500">Deficiency summary</p>
                            {cards.length ? (
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {cards.map((d) => (
                                  <div key={d.nutrient} className="rounded-xl bg-white p-3 border border-stone-100">
                                    <div className="flex justify-between gap-2">
                                      <span className="text-sm font-bold">{d.nutrient}</span>
                                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${severityBadge(d.severity)}`}>
                                        {d.severity}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs text-stone-600">{d.reason}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-stone-500">
                                No deficiency snapshot stored for this report.
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              )}
            </motion.div>
          )}

          {tab === 'sessions' && (
            <motion.div
              key="sess"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {!client ? (
                <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center">
                  <p className="text-stone-600">You don&apos;t have an active booking plan yet.</p>
                  <Link
                    href="/booking/purchase"
                    className="mt-6 inline-flex rounded-xl bg-[#1a472a] px-6 py-3 text-sm font-bold text-white"
                  >
                    Purchase The Core Transformation
                  </Link>
                </div>
              ) : (
                <>
                  <SessionCircles client={client} appointments={appointments} />
                  <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                    <h3 className="font-bold text-lg text-stone-900">Upcoming (confirmed)</h3>
                    <ul className="mt-4 space-y-3">
                      {appointments
                        .filter((a) => a.status === 'confirmed')
                        .map((a) => (
                          <li key={a.id} className="flex justify-between text-sm border-b border-stone-100 pb-2">
                            <span>
                              Session {a.session_number} · {a.scheduled_date} · {String(a.scheduled_time).slice(0, 5)}
                            </span>
                          </li>
                        ))}
                      {!appointments.some((a) => a.status === 'confirmed') && (
                        <li className="text-sm text-stone-500">None scheduled.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                    <h3 className="font-bold text-lg text-stone-900">Completed</h3>
                    <ul className="mt-4 space-y-3">
                      {appointments
                        .filter((a) => a.status === 'completed')
                        .map((a) => (
                          <li key={a.id} className="text-sm text-stone-700 border-b border-stone-100 pb-2">
                            Session {a.session_number} ·{' '}
                            {new Date(a.scheduled_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </li>
                        ))}
                      {!appointments.some((a) => a.status === 'completed') && (
                        <li className="text-sm text-stone-500">No completed sessions yet.</li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {tab === 'progress' && (
            <motion.div
              key="prog"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-stone-900">Log progress</h3>
                  <label className="block text-xs font-bold text-stone-500 uppercase">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                    placeholder="e.g. 62.5"
                  />
                  <label className="block text-xs font-bold text-stone-500 uppercase">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                  />
                  <label className="block text-xs font-bold text-stone-500 uppercase">
                    Energy (1–10): {energy}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={energy}
                    onChange={(e) => setEnergy(Number(e.target.value))}
                    className="w-full accent-[#1a472a]"
                  />
                  <label className="block text-xs font-bold text-stone-500 uppercase">How are you feeling today?</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={logSaving}
                    onClick={() => void handleLogProgress()}
                    className="w-full rounded-xl bg-[#1a472a] py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {logSaving ? 'Saving…' : 'Log Weight & Day'}
                  </button>
                  {logMsg && <p className="text-xs text-stone-600">{logMsg}</p>}
                </div>

                <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-stone-900">Height for BMI (cm)</h3>
                  <p className="text-xs text-stone-500">Saved to your profile when you log progress.</p>
                  <input
                    type="number"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                    placeholder="e.g. 165"
                  />
                  <p className="text-sm text-stone-700">
                    BMI (from latest weight):{' '}
                    <span className="font-black text-[#1a472a]">{bmiDisplay ?? '—'}</span>
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm h-72">
                <h3 className="font-bold text-stone-900 mb-4">Weight trend</h3>
                {weightChartData.length ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={weightChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="kg" stroke="#1a472a" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-stone-500">Log weight to see your chart.</p>
                )}
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm h-72">
                <h3 className="font-bold text-stone-900 mb-4">Energy (last 7 logs)</h3>
                {energyChartData.some((d) => d.energy > 0) ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={energyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="energy" fill="#34d399" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-stone-500">Log energy with your daily entry.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  )
}
