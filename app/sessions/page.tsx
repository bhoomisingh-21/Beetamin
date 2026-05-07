'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser, UserButton } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  Calendar,
  Lock,
  Loader2,
  AlertTriangle,
  Plus,
  User,
  ChevronDown,
  FileText,
} from 'lucide-react'
import {
  getClientDashboard,
  type ClientRow,
  type AppointmentRow,
  type PaidReportSummary,
} from '@/lib/booking-actions'
import type { SessionBookingAccess } from '@/lib/session-booking-access'
import { requestRegeneratePaidReport } from '@/lib/report-dashboard-actions'

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='70' viewBox='0 0 60 70'><path d='M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z' fill='none' stroke='%2322C55E' stroke-width='0.5' stroke-opacity='0.18'/></svg>`
const HEX_URL = `data:image/svg+xml,${encodeURIComponent(HEX_SVG.replace(/'/g, '%27'))}`

const PLAN_FEATURES = [
  { label: '6 Expert Sessions', sub: '30 min each, over 3 months' },
  { label: 'Flexible Scheduling', sub: 'Book at times that suit you' },
  { label: 'Doctor-Reviewed Plans', sub: 'Clinically validated guidance' },
  { label: 'Personalized Protocol', sub: 'Built around your deficiencies' },
]

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    expired: 'bg-red-500/20 text-red-400 border-red-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }
  return (
    <span className={`border rounded-full px-3 py-1 text-xs font-bold ml-3 ${map[status] || map.completed}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Label for dashboard report rows — e.g. "7 May 2026". */
function formatReportDay(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${String(m).padStart(2, '0')} ${period}`
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toIcsDateUtc(d: string, time: string) {
  const [Y, Mo, D] = d.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const dt = new Date(Date.UTC(Y, Mo - 1, D, h ?? 0, mi ?? 0, 0))
  return (
    dt.getUTCFullYear() +
    pad2(dt.getUTCMonth() + 1) +
    pad2(dt.getUTCDate()) +
    'T' +
    pad2(dt.getUTCHours()) +
    pad2(dt.getUTCMinutes()) +
    pad2(dt.getUTCSeconds()) +
    'Z'
  )
}

function utcStampNow() {
  const d = new Date()
  return (
    d.getUTCFullYear() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    'T' +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    'Z'
  )
}

function buildSessionIcs(appt: AppointmentRow & { nutritionists?: { name: string } }) {
  const uid = `${appt.id}@thebeetamin.com`
  const start = toIcsDateUtc(appt.scheduled_date, appt.scheduled_time.slice(0, 5))
  const endDate = new Date(`${appt.scheduled_date}T${appt.scheduled_time.slice(0, 5)}`)
  endDate.setMinutes(endDate.getMinutes() + 30)
  const end =
    endDate.getUTCFullYear() +
    pad2(endDate.getUTCMonth() + 1) +
    pad2(endDate.getUTCDate()) +
    'T' +
    pad2(endDate.getUTCHours()) +
    pad2(endDate.getUTCMinutes()) +
    pad2(endDate.getUTCSeconds()) +
    'Z'
  const title = 'TheBeetamin Nutrition Session'
  const host = appt.nutritionists?.name || 'Nutritionist'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TheBeetamin//Sessions//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${utcStampNow()}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:Session ${appt.session_number} with ${host.replace(/,/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

export default function SessionsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [data, setData] = useState<{
    client: ClientRow | null
    appointments: AppointmentRow[]
    paidReports: PaidReportSummary[]
    sessionBooking: SessionBookingAccess
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null)
  const [openReportId, setOpenReportId] = useState<string | null>(null)
  const [regenBusy, setRegenBusy] = useState(false)
  const [regenError, setRegenError] = useState('')

  useEffect(() => {
    if (!isLoaded || !user) return
    getClientDashboard(user.id)
      .then((result) => {
        setData({
          client: result.client,
          appointments: result.appointments ?? [],
          paidReports: result.paidReports ?? [],
          sessionBooking: result.sessionBooking,
        })
      })
      .catch(() => {
        setData({
          client: null,
          appointments: [],
          paidReports: [],
          sessionBooking: {
            allowed: false,
            reason: 'no_completed_report',
            latestCompletedAmount: null,
          },
        })
      })
      .finally(() => setIsLoading(false))
  }, [isLoaded, user])

  const appointments = data?.appointments ?? []
  const client = data?.client ?? null

  const paidReports = data?.paidReports ?? []
  const sessionBooking = data?.sessionBooking
  const canUseSessionBooking = sessionBooking?.allowed === true

  const sortedPaidReports = useMemo(
    () =>
      [...paidReports].sort((a, b) => {
        const ta = new Date(a.created_at || 0).getTime()
        const tb = new Date(b.created_at || 0).getTime()
        return tb - ta
      }),
    [paidReports],
  )

  useEffect(() => {
    const latest = sortedPaidReports[0]?.report_id ?? null
    if (latest) setOpenReportId((prev) => (prev == null ? latest : prev))
  }, [sortedPaidReports])

  const hasTerminalReport = sortedPaidReports.some((r) =>
    ['ready', 'generated', 'completed'].includes(r.status),
  )
  const hasGeneratingReport = sortedPaidReports.some((r) => r.status === 'generating')
  const showWantUpdatedSection = hasTerminalReport && !hasGeneratingReport

  const latestAssessmentForRegen = sortedPaidReports.find(
    (r) => ['ready', 'generated', 'completed'].includes(r.status) && r.assessment_id,
  )?.assessment_id

  const goBookingFlow = () => {
    if (!canUseSessionBooking) router.push('/booking')
    else router.push('/booking/new')
  }

  async function handleRegenerateReport() {
    const aid = latestAssessmentForRegen
    if (!aid) {
      setRegenError('No assessment is linked to your latest report.')
      return
    }
    setRegenBusy(true)
    setRegenError('')
    const res = await requestRegeneratePaidReport(aid)
    setRegenBusy(false)
    if (!res.ok) {
      setRegenError(res.error)
      return
    }
    router.push(`/report/${encodeURIComponent(res.reportId)}`)
  }

  const apptForSession = useCallback(
    (n: number) => appointments.find((a) => a.session_number === n),
    [appointments],
  )

  const prevSessionCompleted = (n: number) => {
    if (n <= 1) return true
    const prev = apptForSession(n - 1)
    return prev?.status === 'completed'
  }

  const blockingAppt = appointments.find((a) => a.status === 'pending' || a.status === 'confirmed')

  const allSixSessionsComplete = useMemo(
    () => [1, 2, 3, 4, 5, 6].every((n) => apptForSession(n)?.status === 'completed'),
    [apptForSession, appointments],
  )

  const planComplete = allSixSessionsComplete

  const sessionBookable = (n: number) => {
    if (!canUseSessionBooking) return false
    if (!client || client.status !== 'active' || client.sessions_remaining <= 0) return false
    if (blockingAppt) return false
    if (!prevSessionCompleted(n)) return false
    const a = apptForSession(n)
    if (a?.status === 'completed') return false
    if (a?.status === 'confirmed' || a?.status === 'pending') return false
    return n >= 1 && n <= 6
  }

  const canBookNextSession = useMemo(() => {
    if (!canUseSessionBooking) return false
    if (!client || client.status !== 'active' || client.sessions_remaining <= 0) return false
    if (blockingAppt) return false
    for (let n = 1; n <= 6; n++) {
      if (!prevSessionCompleted(n)) continue
      const a = appointments.find((x) => x.session_number === n)
      if (a?.status === 'completed') continue
      if (a?.status === 'confirmed' || a?.status === 'pending') continue
      return true
    }
    return false
  }, [client, appointments, blockingAppt, canUseSessionBooking])

  const nextBookableSessionNumber = useMemo(() => {
    for (let n = 1; n <= 6; n++) {
      if (sessionBookable(n)) return n
    }
    return null
  }, [client, appointments, blockingAppt, apptForSession, canUseSessionBooking])

  const activeAppt = appointments.find((a) => a.status === 'pending' || a.status === 'confirmed')
  const confirmedAppts = appointments.filter((a) => a.status === 'confirmed')
  const completedAppts = appointments.filter((a) => a.status === 'completed')
  const rejectedAppts = appointments.filter((a) => a.status === 'rejected')

  const firstConfirmed = useMemo(() => {
    if (!confirmedAppts.length) return undefined
    return [...confirmedAppts].sort((a, b) => {
      const da = new Date(`${a.scheduled_date}T${a.scheduled_time.slice(0, 5)}`).getTime()
      const db = new Date(`${b.scheduled_date}T${b.scheduled_time.slice(0, 5)}`).getTime()
      return da - db
    })[0]
  }, [confirmedAppts])

  const showNoPlanPricing =
    !!data && (!client || (client.status !== 'active' && !planComplete))

  function downloadIcs() {
    if (!firstConfirmed) return
    const blob = new Blob([buildSessionIcs(firstConfirmed as AppointmentRow & { nutritionists?: { name: string } })], {
      type: 'text/calendar;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `beetamin-session-${firstConfirmed.session_number}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    )
  }

  if (!data) return null

  const daysLeft = client
    ? Math.max(
        0,
        Math.ceil((new Date(client.plan_end_date).getTime() - Date.now()) / 86400000),
      )
    : 0
  const progressPct =
    client && client.sessions_total > 0 ? (client.sessions_used / client.sessions_total) * 100 : 0

  const welcomeName =
    client?.name?.trim()?.split(/\s+/)[0] ||
    user?.firstName ||
    user?.username ||
    'there'

  return (
    <div
      className="min-h-screen bg-[#0A0F14] px-4 py-8"
      style={{
        backgroundImage: `url("${HEX_URL}")`,
        backgroundSize: '60px 70px',
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a href="/" className="flex items-center gap-1.5 text-gray-400 text-sm hover:text-white transition">
            <span className="text-lg">←</span> TheBeetamin
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/profile"
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm border border-white/10 rounded-full px-3 py-1.5 hover:border-white/30 transition"
            >
              <User size={13} />
              Profile
            </a>
            <UserButton />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-white font-black text-3xl md:text-4xl">
              Welcome back, {welcomeName}
            </h1>
            {client && statusBadge(client.status)}
          </div>
        </motion.div>

        {sortedPaidReports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-[#111820] border border-emerald-500/20 rounded-3xl p-6 md:p-8"
          >
            <div className="flex items-start gap-3 mb-4">
              <FileText className="text-emerald-400 shrink-0 mt-1" size={22} />
              <div className="min-w-0">
                <h2 className="text-white font-black text-xl">Your reports</h2>
                <p className="text-gray-500 text-xs mt-1">
                  Reverse chronological · older reports stay in your archive
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {sortedPaidReports.map((r) => {
                const isOpen = openReportId === r.report_id
                const statusLabel =
                  r.status === 'generating'
                    ? 'Generating'
                    : r.status === 'failed'
                      ? 'Failed'
                      : ['ready', 'generated', 'completed'].includes(r.status)
                        ? 'Completed'
                        : r.status

                return (
                  <div
                    key={r.report_id}
                    className="rounded-2xl border border-white/10 bg-[#0A0F14] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenReportId((id) => (id === r.report_id ? null : r.report_id))
                      }
                      className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-4 text-left hover:bg-white/[0.03] transition"
                    >
                      <span className="text-white font-bold text-sm sm:text-base">
                        Report — {formatReportDay(r.created_at)}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                            statusLabel === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : r.status === 'generating'
                                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                                : 'bg-gray-700 text-gray-300 border border-gray-600'
                          }`}
                        >
                          {statusLabel}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-gray-500 transition ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-0 border-t border-white/5">
                        <div className="flex flex-wrap gap-3 mt-4">
                          <Link
                            href={`/report/${encodeURIComponent(r.report_id)}`}
                            className="inline-flex rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-black text-black"
                          >
                            Open report
                          </Link>
                          {typeof r.amount === 'number' ? (
                            <span className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 text-xs text-gray-400">
                              Plan ₹{r.amount.toLocaleString('en-IN')}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {showWantUpdatedSection && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-white font-bold text-base">Want an updated report?</p>
                <p className="text-gray-500 text-sm mt-1">
                  Retake the free quiz for a fresh run, or reuse your current answers — ₹39 checkout is a stub
                  until payment is wired.
                </p>
                {regenError ? (
                  <p className="text-red-400 text-xs mt-3">{regenError}</p>
                ) : null}
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/assessment"
                    onClick={() => {
                      try {
                        sessionStorage.setItem('beetamin.retakePaidReportFlow', '1')
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="inline-flex justify-center rounded-2xl border border-emerald-500/50 px-6 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-500/10 transition"
                  >
                    Retake assessment
                  </Link>
                  <button
                    type="button"
                    disabled={regenBusy || !latestAssessmentForRegen}
                    onClick={() => void handleRegenerateReport()}
                    className="inline-flex justify-center items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 text-sm font-black text-black transition"
                  >
                    {regenBusy ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Starting…
                      </>
                    ) : (
                      'Generate new report'
                    )}
                  </button>
                </div>
                {!latestAssessmentForRegen ? (
                  <p className="text-amber-400/90 text-xs mt-3">
                    Generate new report needs a linked assessment on your latest completed PDF — retake instead if this
                    is missing.
                  </p>
                ) : null}
              </div>
            )}
          </motion.div>
        )}

        {planComplete && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-5 text-center"
          >
            <p className="text-emerald-300 font-black text-lg md:text-xl leading-snug">
              🎉 You&apos;ve completed all 6 sessions!
            </p>
            <a
              href="/booking/purchase"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-black text-black hover:bg-emerald-400 transition"
            >
              Start a New Plan
            </a>
          </motion.div>
        )}

        {showNoPlanPricing && !planComplete && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 grid gap-6 lg:grid-cols-2"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {PLAN_FEATURES.map(({ label, sub }) => (
                  <div key={label} className="bg-[#111820] border border-white/[0.08] rounded-2xl p-4">
                    <p className="text-white font-bold text-sm">{label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#111820] border border-white/[0.08] rounded-2xl p-6">
                <h3 className="text-white font-bold text-base mb-3">The Core Transformation</h3>
                <p className="text-gray-400 text-sm">₹3,999 · 6 sessions · 3 months access</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/10">
              <p className="text-gray-900 font-black text-4xl text-center">₹3,999</p>
              <p className="text-gray-500 text-center text-sm mt-1">One-time · 6 expert sessions</p>
              <a
                href="/booking/purchase"
                className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg rounded-2xl py-4 transition flex items-center justify-center"
              >
                Get Started
              </a>
            </div>
          </motion.div>
        )}

        {!showNoPlanPricing && client && (
          <>
            {!canUseSessionBooking ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-3xl border border-amber-500/40 bg-amber-950/30 p-8 text-center"
              >
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-2xl">
                  🔒
                </div>
                <h2 className="text-white font-black text-xl">Sessions are part of the Full Recovery Plan</h2>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-lg mx-auto">
                  Session booking is included in the Full Recovery Plan (₹3,999). Your ₹39 plan includes your
                  personalised report only.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/booking')}
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-8 py-3.5 text-black font-black text-sm transition"
                >
                  Upgrade to Full Plan
                </button>
              </motion.div>
            ) : (
              <>
                {firstConfirmed && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-2xl border-2 border-blue-500 bg-blue-500/10 p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-blue-300 font-bold text-sm uppercase tracking-wide">Upcoming session</p>
                    <p className="text-white font-black text-xl mt-1">Session {firstConfirmed.session_number}</p>
                    <p className="text-gray-300 text-sm mt-2">
                      {formatDate(firstConfirmed.scheduled_date)} at{' '}
                      {formatTime(firstConfirmed.scheduled_time)}
                    </p>
                    {(firstConfirmed as AppointmentRow & { nutritionists?: { name: string } }).nutritionists?.name && (
                      <p className="text-gray-400 text-sm mt-1">
                        with {(firstConfirmed as AppointmentRow & { nutritionists?: { name: string } }).nutritionists!.name}
                      </p>
                    )}
                    <span className="mt-3 inline-flex rounded-full border border-blue-500/40 bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                      Confirmed
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={downloadIcs}
                    className="shrink-0 rounded-xl border border-blue-400/50 bg-blue-500/20 px-5 py-3 text-sm font-bold text-blue-200 hover:bg-blue-500/30 transition"
                  >
                    Add to Calendar
                  </button>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#111820] border border-white/[0.08] rounded-3xl p-8 mt-6"
            >
              <h2 className="text-white font-bold text-xl">Your Session Progress</h2>
              <div className="bg-gray-700 rounded-full h-2 w-full mt-4">
                <div
                  className="bg-emerald-500 rounded-full h-2 transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-gray-400 text-sm">
                  {client.sessions_used} of {client.sessions_total} sessions completed
                </p>
                <p className="text-gray-400 text-sm">
                  {daysLeft} days left · Expires {new Date(client.plan_end_date).toLocaleDateString('en-IN')}
                </p>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-8">
                {[1, 2, 3, 4, 5, 6].map((n) => {
                  const appt = appointments.find((a) => a.session_number === n)

                  if (appt?.status === 'completed') {
                    return (
                      <div key={n} className="bg-emerald-500 rounded-2xl p-4 text-center">
                        <CheckCircle className="text-black mx-auto" size={24} />
                        <p className="text-black font-bold text-sm mt-1">Session {n}</p>
                        <p className="text-black/70 text-xs mt-1">
                          {new Date(appt.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    )
                  }

                  if (appt?.status === 'confirmed') {
                    return (
                      <div key={n} className="bg-blue-500/20 border-2 border-blue-500 rounded-2xl p-4 text-center">
                        <Calendar className="text-blue-400 mx-auto" size={24} />
                        <p className="text-blue-300 font-bold text-sm mt-1">Session {n}</p>
                        <p className="text-blue-200 text-[10px] leading-tight mt-1 px-0.5">
                          {formatDate(appt.scheduled_date)} · {formatTime(appt.scheduled_time)}
                        </p>
                        <p className="text-blue-400 text-[10px] font-bold mt-0.5">Confirmed</p>
                      </div>
                    )
                  }

                  if (appt?.status === 'pending') {
                    return (
                      <div key={n} className="bg-amber-500/20 border-2 border-amber-500 rounded-2xl p-4 text-center">
                        <Clock className="text-amber-400 mx-auto" size={24} />
                        <p className="text-amber-300 font-bold text-sm mt-1">Session {n}</p>
                        <p className="text-amber-400 text-xs mt-1">Pending</p>
                      </div>
                    )
                  }

                  if (sessionBookable(n)) {
                    return (
                      <div
                        key={n}
                        onClick={goBookingFlow}
                        className="bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl p-4 text-center cursor-pointer hover:bg-emerald-500/20 transition"
                      >
                        <Calendar className="text-emerald-400 mx-auto" size={24} />
                        <p className="text-emerald-300 font-bold text-sm mt-1">Session {n}</p>
                        <p className="text-emerald-400 text-xs mt-1">Book now</p>
                      </div>
                    )
                  }

                  const lockHint =
                    n > 1 && !prevSessionCompleted(n)
                      ? `Complete Session ${n - 1} first`
                      : 'Locked'

                  return (
                    <div key={n} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-center opacity-70">
                      <Lock className="text-gray-500 mx-auto" size={24} />
                      <p className="text-gray-500 font-bold text-sm mt-1">Session {n}</p>
                      <p className="text-gray-600 text-[10px] leading-tight mt-1 px-0.5">{lockHint}</p>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {canBookNextSession && !planComplete && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                onClick={goBookingFlow}
                className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg rounded-2xl py-5 transition flex items-center justify-center gap-2"
              >
                <Plus size={22} />
                Book Session {nextBookableSessionNumber ?? client.sessions_used + 1} →
              </motion.button>
            )}

            {activeAppt && activeAppt.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-6 rounded-2xl p-5 border-2 bg-amber-500/10 border-amber-500"
              >
                <div className="flex items-start gap-3">
                  <Clock className="text-amber-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-amber-300 font-bold text-sm">
                      Session {activeAppt.session_number} — Awaiting confirmation ⏳
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {formatDate(activeAppt.scheduled_date)} at {formatTime(activeAppt.scheduled_time)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {rejectedAppts.length > 0 && !activeAppt && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-3"
              >
                <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-300 font-bold text-sm">Your last request was declined</p>
                  <p className="text-gray-400 text-sm mt-1">Please choose a different date or time slot.</p>
                  <button
                    onClick={goBookingFlow}
                    className="mt-3 bg-emerald-500 text-black font-bold rounded-full px-5 py-2 text-sm hover:bg-emerald-400 transition"
                  >
                    Book a New Slot →
                  </button>
                </div>
              </motion.div>
            )}

            {completedAppts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="mt-6 bg-[#111820] border border-white/[0.08] rounded-3xl p-6 mb-8"
              >
                <h3 className="text-white font-bold text-lg mb-4">Past Sessions</h3>
                {completedAppts.map((appt) => (
                  <div key={appt.id} className="border-b border-white/5 last:border-0 py-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-emerald-400 shrink-0" size={16} />
                        <div>
                          <p className="text-white font-medium">Session {appt.session_number}</p>
                          <p className="text-gray-400 text-sm">
                            {formatDate(appt.scheduled_date)}
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-bold">
                        Completed
                      </span>
                    </div>
                    {appt.notes && (
                      <div className="mt-2 pl-9">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedNotesId((id) => (id === appt.id ? null : appt.id))
                          }
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          View Notes
                          <ChevronDown
                            size={14}
                            className={`transition ${expandedNotesId === appt.id ? 'rotate-180' : ''}`}
                          />
                        </button>
                        <AnimatePresence>
                          {expandedNotesId === appt.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-2 text-gray-500 text-sm italic border-l border-white/10 pl-3"
                            >
                              {appt.notes}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
