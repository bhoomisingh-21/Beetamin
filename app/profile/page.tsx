'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser, SignOutButton } from '@clerk/nextjs'
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
import { ChevronDown, Edit3, Leaf, Loader2, Save, X } from 'lucide-react'
import Footer from '@/components/sections/Footer'
import {
  getDashboardBundle,
  upsertProgressLog,
  updateClientProfile,
  type ClientRow,
} from '@/lib/booking-actions'
import { parseDeficiencySummaryPayload, type DeficiencyItem } from '@/lib/deficiency-profile-parse'

type TabId = 'overview' | 'reports' | 'progress' | 'deficiency'

function daysInPlan(client: ClientRow | null): number {
  if (!client) return 0
  const start = new Date(client.plan_start_date).getTime()
  const end = Math.min(Date.now(), new Date(client.plan_end_date).getTime())
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.max(0, Math.ceil((end - start) / 86400000))
}

function severityBadgeLight(sev: string) {
  if (sev === 'high') return 'bg-red-50 text-red-700 border border-red-200'
  if (sev === 'medium') return 'bg-amber-50 text-amber-800 border border-amber-200'
  return 'bg-emerald-50 text-emerald-800 border border-emerald-200'
}

function severityBadgeAssessmentStyle(sev: string) {
  if (sev === 'high') return 'bg-red-500/15 text-red-600 border border-red-500/25'
  if (sev === 'medium') return 'bg-amber-500/15 text-amber-700 border border-amber-500/25'
  return 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/25'
}

function reportStatusBadgeClass(status: string) {
  if (status === 'ready' || status === 'generated')
    return 'bg-emerald-50 text-emerald-800 border border-emerald-200'
  if (status === 'generating')
    return 'bg-amber-50 text-amber-800 border border-amber-200'
  if (status === 'failed') return 'bg-red-50 text-red-800 border border-red-200'
  return 'bg-stone-100 text-stone-600 border border-stone-200'
}

function bmiMeta(bmi: number) {
  if (bmi < 18.5) return { label: 'Underweight', cls: 'text-blue-600' }
  if (bmi < 25) return { label: 'Normal weight', cls: 'text-emerald-600' }
  if (bmi < 30) return { label: 'Overweight', cls: 'text-orange-600' }
  return { label: 'Obese', cls: 'text-red-600' }
}

export default function ProfileHubPage() {
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
  const [toast, setToast] = useState('')

  const [editMode, setEditMode] = useState(false)
  const [editPhone, setEditPhone] = useState('')
  const [editGoal, setEditGoal] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const reload = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const b = await getDashboardBundle(user.id)
      setBundle(b)
      if (b.client?.height_cm) setHeightCm(String(b.client.height_cm))
      if (b.client) {
        setEditPhone(b.client.phone || '')
        setEditGoal(b.client.assessment_goal || '')
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      router.replace('/sign-in?after=' + encodeURIComponent('/profile'))
      return
    }
    void reload()
  }, [isLoaded, user, router, reload])

  const latestWeightLog = useMemo(() => {
    const logs = bundle?.progressLogs || []
    const withW = logs.filter((l) => l.weight_kg != null)
    if (!withW.length) return null
    return withW.reduce((a, b) => (new Date(a.logged_at) > new Date(b.logged_at) ? a : b))
  }, [bundle?.progressLogs])

  const weightChartData = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000
    const logs = bundle?.progressLogs || []
    return logs
      .filter((l) => l.weight_kg != null && new Date(l.logged_at).getTime() >= cutoff)
      .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
      .map((l) => ({
        date: l.logged_at,
        label: l.logged_at.slice(5),
        kg: Number(l.weight_kg),
      }))
  }, [bundle?.progressLogs])

  const energyChartData = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000
    const logs = bundle?.progressLogs || []
    return logs
      .filter(
        (l) =>
          l.energy_level != null &&
          new Date(l.logged_at).getTime() >= cutoff,
      )
      .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
      .map((l) => ({
        day: l.logged_at.slice(5),
        energy: Number(l.energy_level),
      }))
  }, [bundle?.progressLogs])

  const heightNum = parseFloat(heightCm)
  const latestWeight =
    latestWeightLog?.weight_kg != null ? Number(latestWeightLog.weight_kg) : null
  const bmiNum =
    latestWeight != null && heightNum > 0 ? latestWeight / Math.pow(heightNum / 100, 2) : null
  const bmiDisplay = bmiNum != null ? bmiNum.toFixed(1) : null
  const bmiInfo = bmiNum != null ? bmiMeta(bmiNum) : null

  const deficiencySource = useMemo(() => {
    const reports = bundle?.paidReports ?? []
    for (const r of reports) {
      if (r.status !== 'ready' && r.status !== 'generated') continue
      const p = parseDeficiencySummaryPayload(r.deficiency_summary)
      if (p.deficiencies.length > 0 || p.overallScore != null) return { report: r, parsed: p }
    }
    return null
  }, [bundle?.paidReports])

  async function handleSaveProfile() {
    if (!user?.id || !bundle?.client) return
    setIsSavingProfile(true)
    try {
      await updateClientProfile(user.id, { phone: editPhone, assessment_goal: editGoal })
      setEditMode(false)
      setToast('Profile updated.')
      setTimeout(() => setToast(''), 3000)
      await reload()
    } catch {
      setToast('Could not save profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleLogWeight() {
    if (!user?.id) return
    setLogSaving(true)
    setToast('')
    try {
      const w = weightKg.trim() === '' ? null : parseFloat(weightKg)
      if (w == null || Number.isNaN(w) || w < 20 || w > 300) {
        setToast('Enter a valid weight in kg.')
        return
      }
      const h =
        heightCm.trim() === '' ? null : parseFloat(heightCm)
      if (!bundle?.client?.height_cm && (h == null || Number.isNaN(h) || h < 50 || h > 280)) {
        setToast('Please enter your height in cm.')
        return
      }
      await upsertProgressLog({
        clerkUserId: user.id,
        weight_kg: w,
        logged_at: logDate,
        height_cm: h,
      })
      setWeightKg('')
      setToast('Weight saved.')
      await reload()
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setLogSaving(false)
    }
  }

  async function handleLogEnergy() {
    if (!user?.id) return
    setLogSaving(true)
    setToast('')
    try {
      await upsertProgressLog({
        clerkUserId: user.id,
        energy_level: energy,
        logged_at: new Date().toISOString().slice(0, 10),
      })
      setToast('Energy level saved.')
      await reload()
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setLogSaving(false)
    }
  }

  async function handleSaveNotes() {
    if (!user?.id) return
    const n = notes.slice(0, 280)
    setLogSaving(true)
    setToast('')
    try {
      await upsertProgressLog({
        clerkUserId: user.id,
        notes: n,
        logged_at: new Date().toISOString().slice(0, 10),
      })
      setNotes('')
      setToast('Notes saved.')
      await reload()
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Could not save')
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

  const { client, paidReports, latestReadyReport, assessmentDates } = bundle
  const displayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const planBadge = !client
    ? { label: 'No Plan', cls: 'bg-stone-200 text-stone-700 border border-stone-300' }
    : client.status === 'active'
      ? { label: 'Active', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' }
      : client.status === 'expired'
        ? { label: 'Expired', cls: 'bg-red-100 text-red-800 border border-red-200' }
        : { label: 'Completed', cls: 'bg-blue-100 text-blue-900 border border-blue-200' }

  const daysLabel =
    client && client.status === 'active' ? String(daysInPlan(client)) : client ? 'No active plan' : '—'

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: 'My Reports' },
    { id: 'progress', label: 'Progress' },
    { id: 'deficiency', label: 'Deficiency Profile' },
  ]

  const reportDateSubtitle = deficiencySource?.report.created_at
    ? new Date(deficiencySource.report.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-stone-900">
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-lg">
          {toast}
        </div>
      )}

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
              href="/sessions"
              className="rounded-xl bg-[#0A0F14] px-3 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              My Sessions
            </Link>
            <SignOutButton redirectUrl="/">
              <button
                type="button"
                className="text-sm font-medium text-stone-600 hover:text-stone-900 px-2"
              >
                Log out
              </button>
            </SignOutButton>
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
                <div className="flex flex-wrap items-start gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-800 ring-2 ring-emerald-200/80">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-black text-stone-900">{displayName}</h1>
                    <p className="mt-1 text-sm text-stone-600">
                      {user?.primaryEmailAddress?.emailAddress || '—'}
                    </p>
                    <span
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${planBadge.cls}`}
                    >
                      {planBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Sessions Used', value: client ? String(client.sessions_used) : '—' },
                  { label: 'Sessions Remaining', value: client ? String(client.sessions_remaining) : '—' },
                  {
                    label: 'Reports Generated',
                    value: String(
                      paidReports.filter((p) => p.status === 'ready' || p.status === 'generated').length,
                    ),
                  },
                  {
                    label: 'Days in Plan',
                    value: client && client.status === 'active' ? String(daysInPlan(client)) : daysLabel,
                  },
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

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sessions"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1a472a] px-6 py-4 text-center text-sm font-bold text-white shadow-md hover:bg-[#143622]"
                >
                  Book My Next Session
                </Link>
                {latestReadyReport && (
                  <Link
                    href={`/report/${encodeURIComponent(latestReadyReport.report_id)}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-[#1a472a]/30 bg-white px-6 py-4 text-center text-sm font-bold text-[#1a472a] hover:bg-emerald-50"
                  >
                    View Latest Report
                  </Link>
                )}
              </div>

              {latestWeightLog && (
                <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
                    Latest weight log
                  </h2>
                  <p className="mt-3 text-2xl font-black text-[#1a472a]">
                    {Number(latestWeightLog.weight_kg).toFixed(1)} kg
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    BMI:{' '}
                    {latestWeightLog.bmi != null ? (
                      <>
                        <span className="font-bold">{Number(latestWeightLog.bmi).toFixed(1)}</span>
                        <span className={` ml-2 ${bmiMeta(Number(latestWeightLog.bmi)).cls}`}>
                          ({bmiMeta(Number(latestWeightLog.bmi)).label})
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </p>
                  <p className="mt-2 text-xs text-stone-500">
                    Last logged:{' '}
                    {new Date(latestWeightLog.logged_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {client && (
                <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-stone-900">Account</h2>
                    {!editMode ? (
                      <button
                        type="button"
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false)
                          setEditPhone(client.phone || '')
                          setEditGoal(client.assessment_goal || '')
                        }}
                        className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
                      >
                        <X size={14} /> Cancel
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-stone-500">Phone / WhatsApp</p>
                      {editMode ? (
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                        />
                      ) : (
                        <p className="mt-1 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
                          {client.phone || '—'}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-stone-500">Health goal</p>
                      {editMode ? (
                        <input
                          type="text"
                          value={editGoal}
                          onChange={(e) => setEditGoal(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                        />
                      ) : (
                        <p className="mt-1 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
                          {client.assessment_goal || '—'}
                        </p>
                      )}
                    </div>
                  </div>
                  {editMode && (
                    <button
                      type="button"
                      disabled={isSavingProfile}
                      onClick={() => void handleSaveProfile()}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Save size={16} />
                      {isSavingProfile ? 'Saving…' : 'Save'}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'reports' && (
            <motion.div
              key="rep"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {paidReports.length === 0 ? (
                <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
                  <p className="text-stone-600">Take your free assessment to get started</p>
                  <Link
                    href="/assessment"
                    className="mt-6 inline-flex rounded-xl bg-[#1a472a] px-6 py-3 text-sm font-bold text-white"
                  >
                    Take assessment
                  </Link>
                </div>
              ) : (
                paidReports.map((r) => {
                  const expanded = expandedReport === r.report_id
                  const parsed = parseDeficiencySummaryPayload(r.deficiency_summary)
                  const assessDate = r.assessment_id ? assessmentDates[r.assessment_id] : null
                  const ready = r.status === 'ready' || r.status === 'generated'
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
                              : '—'}
                          </p>
                          <span
                            className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${reportStatusBadgeClass(r.status)}`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`shrink-0 text-stone-400 transition ${expanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <div className="flex flex-wrap gap-2 border-t border-stone-100 px-5 py-3">
                        {ready && (
                          <a
                            href={`/api/download-report?reportId=${encodeURIComponent(r.report_id)}&disposition=attachment`}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            Download PDF
                          </a>
                        )}
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
                            {parsed.deficiencies.length ? (
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {parsed.deficiencies.map((d: DeficiencyItem) => (
                                  <div key={d.nutrient} className="rounded-xl bg-white p-3 border border-stone-100">
                                    <div className="flex justify-between gap-2">
                                      <span className="text-sm font-bold">{d.nutrient}</span>
                                      <span
                                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${severityBadgeLight(d.severity)}`}
                                      >
                                        {d.severity}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs text-stone-600">{d.reason}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-stone-500">No deficiency snapshot for this report.</p>
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

          {tab === 'progress' && (
            <motion.div key="prog" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-stone-900">Weight</h3>
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
                    Height (cm)
                    {!client?.height_cm && (
                      <span className="ml-1 font-bold text-amber-700 normal-case">
                        — required on first weight log
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                    placeholder={client?.height_cm ? String(client.height_cm) : 'e.g. 165'}
                  />
                  <button
                    type="button"
                    disabled={logSaving}
                    onClick={() => void handleLogWeight()}
                    className="w-full rounded-xl bg-[#1a472a] py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    Log Weight
                  </button>
                </div>

                <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-3">
                  <h3 className="font-bold text-stone-900">BMI</h3>
                  <p className="text-3xl font-black text-[#1a472a]">{bmiDisplay ?? '—'}</p>
                  {bmiInfo && (
                    <p className={`text-sm font-bold ${bmiInfo.cls}`}>{bmiInfo.label}</p>
                  )}
                  <p className="text-xs text-stone-500">Uses your latest logged weight and saved height.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-stone-900">Energy</h3>
                <p className="text-sm text-stone-600">How&apos;s your energy today?</p>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <p className="text-sm font-semibold text-stone-800">{energy} / 10</p>
                <button
                  type="button"
                  disabled={logSaving}
                  onClick={() => void handleLogEnergy()}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Log Energy
                </button>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-stone-900">Daily notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 280))}
                  rows={4}
                  placeholder="How are you feeling today?"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                />
                <p className="text-xs text-stone-400">{notes.length}/280</p>
                <button
                  type="button"
                  disabled={logSaving}
                  onClick={() => void handleSaveNotes()}
                  className="rounded-xl bg-[#1a472a] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#143622] disabled:opacity-60"
                >
                  Save notes
                </button>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm h-72">
                <h3 className="font-bold text-stone-900 mb-4">Weight (last 30 days)</h3>
                {weightChartData.length ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={weightChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="kg" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-stone-500">Log weight to see your chart.</p>
                )}
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm h-72">
                <h3 className="font-bold text-stone-900 mb-4">Energy (last 7 days)</h3>
                {energyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={energyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="energy" fill="#059669" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-stone-500">Log energy to see your chart.</p>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'deficiency' && (
            <motion.div
              key="def"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {paidReports.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center shadow-sm">
                  <p className="text-stone-600">
                    Your deficiency profile will appear here after you get your paid report
                  </p>
                  <Link
                    href="/assessment/results"
                    className="mt-6 inline-flex rounded-xl bg-[#1a472a] px-6 py-3 text-sm font-bold text-white"
                  >
                    Get Assessment Report
                  </Link>
                </div>
              ) : !deficiencySource ? (
                <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
                  <p className="text-stone-600">
                    Your deficiency profile will appear when your paid report is ready.
                  </p>
                  {latestReadyReport && (
                    <Link
                      href={`/report/${encodeURIComponent(latestReadyReport.report_id)}`}
                      className="mt-6 inline-flex rounded-xl border-2 border-[#1a472a]/30 px-6 py-3 text-sm font-bold text-[#1a472a]"
                    >
                      View report
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {reportDateSubtitle && (
                    <p className="text-sm text-stone-500">
                      From your report on {reportDateSubtitle}
                    </p>
                  )}
                  {deficiencySource.parsed.overallScore != null && (
                    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm text-center">
                      <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        Overall deficiency score
                      </p>
                      <p className="mt-2 text-4xl font-black text-[#1a472a]">
                        {Math.round(deficiencySource.parsed.overallScore)}
                        <span className="text-lg text-stone-400">/100</span>
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    {deficiencySource.parsed.deficiencies.map((def: DeficiencyItem, i: number) => (
                      <motion.div
                        key={`${def.nutrient}-${i}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-base text-stone-900 leading-snug">{def.nutrient}</p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 uppercase ${severityBadgeAssessmentStyle(def.severity)}`}
                          >
                            {def.severity} risk
                          </span>
                        </div>
                        <p className="text-stone-600 mt-2 text-sm leading-relaxed">{def.reason}</p>
                        {def.symptoms.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {def.symptoms.map((s: string, j: number) => (
                              <span
                                key={j}
                                className="bg-stone-100 text-stone-600 text-[10px] px-2 py-0.5 rounded-full border border-stone-200"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  {!deficiencySource.parsed.deficiencies.length && (
                    <p className="text-sm text-stone-500">No deficiency rows stored for this report.</p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  )
}
