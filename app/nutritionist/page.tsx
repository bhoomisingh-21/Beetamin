'use client'

import { useState, useEffect, useTransition } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, CalendarCheck, Clock, Loader2,
  XCircle, AlertTriangle, Settings, Leaf,
  ClipboardCheck, TriangleAlert, CheckCircle,
} from 'lucide-react'
import {
  getNutritionistDashboard,
  confirmAppointment,
  rejectAppointment,
  completeAppointment,
  type AppointmentWithClient,
} from '@/lib/nutritionist-actions'
import { isNutritionistEmail } from '@/lib/nutritionist-config'

type DashboardData = Awaited<ReturnType<typeof getNutritionistDashboard>>

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
  appt, onClose, onDone,
}: {
  appt: AppointmentWithClient
  onClose: () => void
  onDone: () => void
}) {
  const [tab, setTab] = useState<'confirm' | 'reject'>('confirm')
  const [notes, setNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [isPending, start] = useTransition()

  function doConfirm() {
    start(async () => { await confirmAppointment(appt.id); onDone(); onClose() })
  }
  function doReject() {
    start(async () => { await rejectAppointment(appt.id, rejectReason); onDone(); onClose() })
  }
  function doComplete() {
    start(async () => { await completeAppointment(appt.id, notes); onDone(); onClose() })
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
            {/* Confirm / Reject tabs */}
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
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [selectedAppt, setSelectedAppt] = useState<AppointmentWithClient | null>(null)

  async function load() {
    if (!user) return
    const data = await getNutritionistDashboard()
    if (!data) { router.push('/nutritionist-dashboard'); return }
    setDashboard(data)
    setIsLoading(false)
  }

  useEffect(() => {
    if (!isLoaded || !user) return
    const email = user.primaryEmailAddress?.emailAddress ?? ''
    if (!isNutritionistEmail(email)) {
      router.replace('/')
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user])

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
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
          <a href="/" className="mt-4 inline-block text-emerald-400 hover:underline text-sm">← Go home</a>
        </div>
      </div>
    )
  }

  // Build the "all appointments" list sorted by date desc
  const allByTab: Record<TabKey, AppointmentWithClient[]> = {
    pending:   dashboard.pending,
    confirmed: dashboard.upcoming,
    cancelled: dashboard.past.filter((a) => a.status === 'rejected' || a.status === 'cancelled'),
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number; color: string }[] = [
    { key: 'confirmed', label: 'Scheduled', icon: <CalendarCheck size={16} />, count: dashboard.upcoming.length, color: 'text-emerald-400' },
    { key: 'pending',   label: 'Pending',   icon: <Clock size={16} />,        count: dashboard.pending.length,    color: 'text-amber-400'   },
    { key: 'cancelled', label: 'Cancelled', icon: <TriangleAlert size={16} />, count: allByTab.cancelled.length,  color: 'text-red-400'     },
  ]

  const rows = allByTab[activeTab]

  return (
    <div className="min-h-screen bg-[#0A0F14]">
      {/* Top bar */}
      <div className="bg-[#0A0F14]/90 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <Leaf className="text-emerald-500" size={18} />
          <span className="text-white font-bold">TheBeetamin</span>
        </a>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/nutritionist-dashboard/availability')}
            className="hidden sm:flex items-center gap-2 text-gray-400 hover:text-white text-sm border border-white/10 rounded-xl px-4 py-2 transition hover:border-white/30"
          >
            <Settings size={14} /> Availability
          </button>
          <span className="text-gray-400 text-sm hidden sm:block">Admin Dashboard</span>
          <UserButton />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-white font-black text-3xl">Welcome 👋</h1>
          <p className="text-gray-400 mt-1">Start the day with managing new appointments</p>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { icon: <CalendarCheck size={22} />, value: dashboard.upcoming.length, label: 'Scheduled appointments', bg: 'bg-amber-500/10 border-amber-500/20', icon_color: 'text-amber-400' },
            { icon: <Clock size={22} />,         value: dashboard.pending.length,  label: 'Pending appointments',   bg: 'bg-orange-500/10 border-orange-500/20', icon_color: 'text-orange-400' },
            { icon: <TriangleAlert size={22} />, value: allByTab.cancelled.length, label: 'Cancelled appointments', bg: 'bg-red-500/10 border-red-500/20',       icon_color: 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className={`border rounded-2xl p-5 ${s.bg}`}>
              <div className={s.icon_color}>{s.icon}</div>
              <p className="text-white font-black text-4xl mt-2">{s.value}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-3 mb-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
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
          className="bg-[#111820] border border-white/[0.08] rounded-3xl overflow-hidden"
        >
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
              <Calendar size={40} className="mb-3" />
              <p className="font-medium">No {activeTab} appointments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
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
                    <tr
                      key={appt.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition"
                    >
                      {/* # */}
                      <td className="px-5 py-4 text-gray-500 text-sm font-medium">{idx + 1}</td>

                      {/* Patient */}
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

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold border rounded-full px-3 py-1 ${STATUS_BADGE[appt.status] || STATUS_BADGE.pending}`}>
                          {appt.status === 'pending' && <Clock size={9} />}
                          {appt.status === 'confirmed' && <CheckCircle size={9} />}
                          {(appt.status === 'rejected' || appt.status === 'cancelled') && <XCircle size={9} />}
                          {appt.status === 'completed' && <ClipboardCheck size={9} />}
                          {appt.status === 'confirmed' ? 'Scheduled' : appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                        </span>
                      </td>

                      {/* Appointment */}
                      <td className="px-4 py-4">
                        <p className="text-white text-sm">{formatDate(appt.scheduled_date)}, {formatTime(appt.scheduled_time)}</p>
                        {appt.reason && (
                          <p className="text-gray-500 text-xs mt-0.5 max-w-[200px] truncate" title={appt.reason}>
                            {appt.reason}
                          </p>
                        )}
                      </td>

                      {/* Session # */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-gray-400 text-sm font-medium">#{appt.session_number}</span>
                      </td>

                      {/* Actions */}
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
                            onClick={() => { setSelectedAppt(appt) }}
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
          )}
        </motion.div>
      </div>

      {/* Action modal */}
      <AnimatePresence>
        {selectedAppt && (
          <ActionModal
            appt={selectedAppt}
            onClose={() => setSelectedAppt(null)}
            onDone={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
