'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, CalendarCheck, Clock, Loader2, LogOut,
  XCircle, AlertTriangle, Settings, Leaf,
  ClipboardCheck, TriangleAlert, CheckCircle,
} from 'lucide-react'
import {
  getNutritionistDashboardByEmail,
  confirmAppointmentByEmail,
  rejectAppointmentByEmail,
  completeAppointmentByEmail,
  type AppointmentWithClient,
} from '@/lib/nutritionist-actions'
import { isNutritionistEmail } from '@/lib/nutritionist-config'
import { supabase } from '@/lib/supabase'

type DashboardData = Awaited<ReturnType<typeof getNutritionistDashboardByEmail>>

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

type TabKey = 'pending' | 'confirmed' | 'cancelled'

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  rejected:  'bg-red-500/15 text-red-400 border-red-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}

// ── Action modal ──────────────────────────────────────────────────────────────
function ActionModal({
  appt, nutEmail, onClose, onDone,
}: {
  appt: AppointmentWithClient
  nutEmail: string
  onClose: () => void
  onDone: () => void
}) {
  const [tab, setTab] = useState<'confirm' | 'reject'>('confirm')
  const [notes, setNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [isPending, start] = useTransition()

  function doConfirm() {
    start(async () => { await confirmAppointmentByEmail(appt.id, nutEmail); onDone(); onClose() })
  }
  function doReject() {
    start(async () => { await rejectAppointmentByEmail(appt.id, nutEmail, rejectReason); onDone(); onClose() })
  }
  function doComplete() {
    start(async () => { await completeAppointmentByEmail(appt.id, nutEmail, notes); onDone(); onClose() })
  }

  const isComplete = appt.status === 'confirmed'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111820] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-emerald-400 font-black">{appt.clients.name.charAt(0)}</span>
          </div>
          <div>
            <p className="text-white font-bold">{appt.clients.name}</p>
            <p className="text-gray-400 text-xs">{formatDate(appt.scheduled_date)} · {formatTime(appt.scheduled_time)}</p>
          </div>
        </div>

        {isComplete ? (
          <>
            <h3 className="text-white font-bold text-sm mb-3">Mark session complete</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Session notes, recommendations, follow-up..."
              rows={4}
              className="w-full bg-[#0A0F14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none resize-none"
            />
            <button
              onClick={doComplete}
              disabled={isPending}
              className="mt-4 w-full bg-emerald-500 text-black font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-emerald-400 transition disabled:opacity-50"
            >
              {isPending ? <Loader2 className="animate-spin" size={16} /> : <ClipboardCheck size={16} />}
              Mark Complete
            </button>
          </>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setTab('confirm')} className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${tab === 'confirm' ? 'bg-emerald-500 text-black' : 'bg-[#0A0F14] text-gray-400 border border-white/10'}`}>
                Schedule
              </button>
              <button onClick={() => setTab('reject')} className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${tab === 'reject' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-[#0A0F14] text-gray-400 border border-white/10'}`}>
                Cancel
              </button>
            </div>
            {tab === 'confirm' ? (
              <button
                onClick={doConfirm}
                disabled={isPending}
                className="w-full bg-emerald-500 text-black font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-emerald-400 transition disabled:opacity-50"
              >
                {isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                Confirm Session
              </button>
            ) : (
              <>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for cancelling (optional)"
                  className="w-full bg-[#0A0F14] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:border-red-500 focus:outline-none mb-3"
                />
                <button
                  onClick={doReject}
                  disabled={isPending}
                  className="w-full border border-red-500/40 text-red-400 font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-red-500/10 transition disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                  Cancel Session
                </button>
              </>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function NutritionistDashboard() {
  const router = useRouter()
  const [nutEmail, setNutEmail] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [selectedAppt, setSelectedAppt] = useState<AppointmentWithClient | null>(null)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return

      if (!session) {
        // No Supabase session — middleware should have caught this, but guard anyway
        router.replace('/sign-in')
        return
      }

      const email = session.user.email ?? ''
      if (!isNutritionistEmail(email)) {
        supabase.auth.signOut().then(() => {
          if (cancelled) return
          void fetch('/api/auth/nutritionist-session', { method: 'DELETE' }).finally(() => {
            router.replace('/sign-in')
          })
        })
        return
      }

      setNutEmail(email)

      getNutritionistDashboardByEmail(email)
        .then((data) => {
          if (cancelled) return
          // null means nutritionist row not yet in DB — show empty dashboard, not a redirect
          setDashboard(data)
          setIsLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setLoadError('Failed to load dashboard. Please refresh.')
          setIsLoading(false)
        })
    }).catch(() => {
      if (cancelled) return
      setLoadError('Session check failed. Please refresh.')
      setIsLoading(false)
    })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    await fetch('/api/auth/nutritionist-session', { method: 'DELETE' })
    router.push('/sign-in')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertTriangle className="text-red-400" size={32} />
        <p className="text-white font-bold">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-6 py-2.5 text-sm transition"
        >
          Refresh
        </button>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="text-amber-400 mx-auto mb-4" size={40} />
          <p className="text-white font-bold text-xl">Access Denied</p>
          <p className="text-gray-400 mt-2">Your account is not registered as a nutritionist.</p>
          <button onClick={handleLogout} className="mt-4 inline-block text-emerald-400 hover:underline text-sm">← Go to sign-in</button>
        </div>
      </div>
    )
  }

  const allByTab: Record<TabKey, AppointmentWithClient[]> = {
    pending:   dashboard.pending,
    confirmed: dashboard.upcoming,
    cancelled: dashboard.past.filter((a) => a.status === 'rejected' || a.status === 'cancelled'),
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'confirmed', label: 'Scheduled', icon: <CalendarCheck size={16} />, count: dashboard.upcoming.length },
    { key: 'pending',   label: 'Pending',   icon: <Clock size={16} />,         count: dashboard.pending.length  },
    { key: 'cancelled', label: 'Cancelled', icon: <TriangleAlert size={16} />, count: allByTab.cancelled.length },
  ]

  const rows = allByTab[activeTab]

  // Nutritionist initials for avatar
  const initials = (dashboard.nutritionist?.name ?? nutEmail ?? 'N')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-[#0A0F14]">
      {/* Top bar */}
      <div className="bg-[#0A0F14]/90 border-b border-white/5 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href="#" className="flex items-center gap-2 min-w-0" onClick={(e) => e.preventDefault()}>
            <Leaf className="text-emerald-500 shrink-0" size={18} />
            <span className="text-white font-bold text-sm sm:text-base truncate">TheBeetamin</span>
          </a>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => router.push('/nutritionist-dashboard/availability')}
              className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-white text-xs sm:text-sm border border-white/10 rounded-xl px-3 sm:px-4 py-2 transition hover:border-white/30"
            >
              <Settings size={14} className="shrink-0" />
              <span>Availability</span>
            </button>
            <span className="text-gray-500 text-xs hidden md:inline">Admin</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-black text-xs shrink-0">
              {initials}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs sm:text-sm font-bold transition"
            >
              <LogOut size={14} className="shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-white font-black text-2xl sm:text-3xl">Welcome 👋</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Start the day with managing new appointments</p>
        </motion.div>

        {/* Stat cards — always 3 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8"
        >
          {[
            { icon: <CalendarCheck className="w-5 h-5 sm:w-[22px] sm:h-[22px] shrink-0" strokeWidth={2} />, value: dashboard.upcoming.length, label: 'Scheduled', sub: 'Confirmed sessions', bg: 'bg-amber-500/10 border-amber-500/20', icon_color: 'text-amber-400' },
            { icon: <Clock className="w-5 h-5 sm:w-[22px] sm:h-[22px] shrink-0" strokeWidth={2} />,         value: dashboard.pending.length,  label: 'Pending',   sub: 'Awaiting your action', bg: 'bg-orange-500/10 border-orange-500/20', icon_color: 'text-orange-400' },
            { icon: <TriangleAlert className="w-5 h-5 sm:w-[22px] sm:h-[22px] shrink-0" strokeWidth={2} />, value: allByTab.cancelled.length, label: 'Cancelled', sub: 'Rejected or cancelled', bg: 'bg-red-500/10 border-red-500/20',       icon_color: 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className={`min-w-0 border rounded-xl sm:rounded-2xl p-3 sm:p-5 ${s.bg}`}>
              <div className={s.icon_color}>{s.icon}</div>
              <p className="text-white font-black text-2xl sm:text-4xl mt-1.5 sm:mt-2 tabular-nums">{s.value}</p>
              <p className="text-white/90 text-xs sm:text-sm font-semibold mt-0.5 sm:mt-1 truncate">{s.label}</p>
              <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 leading-snug line-clamp-2">{s.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                activeTab === t.key
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-[#111820] text-gray-400 border border-white/[0.08] hover:text-white'
              }`}
            >
              {t.icon}
              {t.label}
              {t.count > 0 && (
                <span className={`rounded-full text-xs px-2 py-0.5 font-bold ${
                  activeTab === t.key ? 'bg-black/20 text-black' : 'bg-white/10 text-white'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="bg-[#111820] border border-white/[0.08] rounded-2xl sm:rounded-3xl overflow-hidden"
        >
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-gray-600 px-4">
              <Calendar size={40} className="mb-3" />
              <p className="font-medium text-center text-sm">No {activeTab} appointments</p>
            </div>
          ) : (
            <>
            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-white/5 p-3 space-y-0">
              {rows.map((appt) => (
                <li key={appt.id} className="py-4 first:pt-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                        {appt.clients.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{appt.clients.name}</p>
                        <p className="text-gray-500 text-xs truncate">{appt.clients.phone}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 ${STATUS_BADGE[appt.status] || STATUS_BADGE.pending}`}>
                      {appt.status === 'confirmed' ? 'Scheduled' : appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-white text-sm mt-2">{formatDate(appt.scheduled_date)}, {formatTime(appt.scheduled_time)}</p>
                  {appt.reason && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{appt.reason}</p>}
                  <p className="text-gray-500 text-xs mt-1">Session #{appt.session_number}</p>
                  {(appt.status === 'pending' || appt.status === 'confirmed') && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedAppt(appt)}
                        className={`text-xs font-bold rounded-xl px-4 py-2.5 flex-1 min-w-[120px] ${
                          appt.status === 'confirmed'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {appt.status === 'confirmed' ? 'Complete' : 'Schedule'}
                      </button>
                      {appt.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => setSelectedAppt(appt)}
                          className="text-xs font-bold rounded-xl px-4 py-2.5 text-red-400 border border-red-500/25 flex-1 min-w-[100px]"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-gray-500 text-xs font-medium text-left px-5 py-4">#</th>
                    <th className="text-gray-500 text-xs font-medium text-left px-4 py-4">Patient</th>
                    <th className="text-gray-500 text-xs font-medium text-left px-4 py-4">Status</th>
                    <th className="text-gray-500 text-xs font-medium text-left px-4 py-4">Appointment</th>
                    <th className="text-gray-500 text-xs font-medium text-left px-4 py-4 hidden md:table-cell">Session</th>
                    <th className="text-gray-500 text-xs font-medium text-left px-4 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((appt, idx) => (
                    <tr key={appt.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 text-gray-500 text-sm font-medium">{idx + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                            {appt.clients.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{appt.clients.name}</p>
                            <p className="text-gray-500 text-xs">{appt.clients.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold border rounded-full px-3 py-1 ${STATUS_BADGE[appt.status] || STATUS_BADGE.pending}`}>
                          {appt.status === 'pending' && <Clock size={9} />}
                          {appt.status === 'confirmed' && <CheckCircle size={9} />}
                          {(appt.status === 'rejected' || appt.status === 'cancelled') && <XCircle size={9} />}
                          {appt.status === 'completed' && <ClipboardCheck size={9} />}
                          {appt.status === 'confirmed' ? 'Scheduled' : appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-white text-sm">{formatDate(appt.scheduled_date)}, {formatTime(appt.scheduled_time)}</p>
                        {appt.reason && (
                          <p className="text-gray-500 text-xs mt-0.5 max-w-[200px] truncate" title={appt.reason}>{appt.reason}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-gray-400 text-sm font-medium">#{appt.session_number}</span>
                      </td>
                      <td className="px-4 py-4">
                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                          <button
                            onClick={() => setSelectedAppt(appt)}
                            className={`text-sm font-bold rounded-xl px-4 py-2 transition ${
                              appt.status === 'confirmed'
                                ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                            }`}
                          >
                            {appt.status === 'confirmed' ? 'Complete' : 'Schedule'}
                          </button>
                        )}
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => setSelectedAppt(appt)}
                            className="ml-2 text-sm font-bold rounded-xl px-4 py-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedAppt && nutEmail && (
          <ActionModal
            appt={selectedAppt}
            nutEmail={nutEmail}
            onClose={() => setSelectedAppt(null)}
            onDone={() => {
              void getNutritionistDashboardByEmail(nutEmail).then(setDashboard)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
