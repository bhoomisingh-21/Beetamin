'use client'

import { useState, useEffect, useTransition } from 'react'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Leaf, ChevronLeft, Loader2, CheckCircle, XCircle, Clock,
  User, CalendarDays, Settings2, Edit3, Save, X,
  ClipboardCheck, AlertCircle,
} from 'lucide-react'
import { getClientDashboard, updateClientProfile, cancelAppointment } from '@/lib/booking-actions'

type DashboardData = Awaited<ReturnType<typeof getClientDashboard>>
type Appointment = NonNullable<DashboardData>['appointments'][0]

type Tab = 'personal' | 'bookings' | 'manage'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  confirmed: { label: 'Scheduled', className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
  completed: { label: 'Completed', className: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
  rejected:  { label: 'Cancelled', className: 'bg-red-500/15 text-red-500 border-red-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/15 text-red-500 border-red-500/30' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [data, setData] = useState<DashboardData>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Editable fields
  const [editMode, setEditMode] = useState(false)
  const [editPhone, setEditPhone] = useState('')
  const [editGoal, setEditGoal] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Cancel state
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function load() {
    if (!user) return
    const result = await getClientDashboard(user.id)
    setData(result)
    if (result) {
      setEditPhone(result.client.phone || '')
      setEditGoal(result.client.assessment_goal || '')
    }
    setIsLoadingData(false)
  }

  useEffect(() => {
    if (!isLoaded || !user) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user])

  async function handleSave() {
    if (!user) return
    setIsSaving(true)
    try {
      await updateClientProfile(user.id, { phone: editPhone, assessment_goal: editGoal })
      setSaveSuccess(true)
      setEditMode(false)
      setTimeout(() => setSaveSuccess(false), 3000)
      await load()
    } catch {
      // fail silently
    }
    setIsSaving(false)
  }

  function handleCancel(apptId: string) {
    setCancellingId(apptId)
    startTransition(async () => {
      try {
        await cancelAppointment(apptId)
        await load()
      } catch { /* ignore */ }
      setCancellingId(null)
    })
  }

  if (!isLoaded || isLoadingData) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    )
  }

  const displayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'
  const userInitial = displayName.charAt(0).toUpperCase()
  const userEmail = user?.primaryEmailAddress?.emailAddress || ''

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex flex-col items-center justify-center px-4 text-center gap-4">
        <AlertCircle className="text-amber-400" size={40} />
        <p className="text-white font-bold text-xl">No profile found</p>
        <p className="text-gray-400 text-sm">Complete your profile setup to get started.</p>
        <button
          onClick={() => router.push('/booking/onboard')}
          className="mt-2 bg-emerald-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 transition"
        >
          Set Up Profile
        </button>
      </div>
    )
  }

  const { client, appointments } = data
  const upcoming = appointments.filter((a) => ['pending', 'confirmed'].includes(a.status))
  const past = appointments.filter((a) => ['completed', 'rejected', 'cancelled'].includes(a.status))

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'personal',  label: 'Personal Info', icon: <User size={15} /> },
    { key: 'bookings',  label: 'My Bookings',   icon: <CalendarDays size={15} /> },
    { key: 'manage',    label: 'Manage',         icon: <Settings2 size={15} /> },
  ]

  return (
    <div className="min-h-screen bg-[#0A0F14]">
      {/* Top bar */}
      <div className="bg-[#0A0F14]/90 border-b border-white/5 px-4 py-3.5 flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Leaf className="text-emerald-500" size={16} />
          <span className="text-white font-bold text-sm">TheBeetamin</span>
        </div>
        <SignOutButton redirectUrl="/">
          <button className="text-gray-400 hover:text-red-400 text-sm transition">Logout</button>
        </SignOutButton>
      </div>

      {/* Desktop 2-col wrapper */}
      <div className="flex flex-col lg:flex-row lg:min-h-[calc(100vh-57px)]">

      {/* ── Left: main content ── */}
      <div className="flex-1 px-4 py-8 lg:max-w-3xl lg:mx-auto w-full">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-5 mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-black font-black text-2xl shrink-0">
            {userInitial}
          </div>
          <div>
            <h1 className="text-white font-black text-2xl">{displayName}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{userEmail}</p>
            <div className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              client.status === 'active'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
            }`}>
              {client.status === 'active' ? <CheckCircle size={10} /> : <Clock size={10} />}
              {client.status.charAt(0).toUpperCase() + client.status.slice(1)} Plan
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
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
            </button>
          ))}
        </div>

        {/* ── Personal Info Tab ── */}
        {activeTab === 'personal' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#111820] border border-white/[0.08] rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-lg">Personal Information</h2>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition"
                >
                  <Edit3 size={14} /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditMode(false); setEditPhone(client.phone || ''); setEditGoal(client.assessment_goal || '') }}
                    className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition"
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Name — read-only (from Clerk) */}
              <div>
                <p className="text-gray-500 text-xs mb-1 font-medium">Full Name</p>
                <p className="text-white text-sm bg-[#0A0F14] border border-white/5 rounded-xl px-4 py-3">{displayName}</p>
              </div>

              {/* Email — read-only */}
              <div>
                <p className="text-gray-500 text-xs mb-1 font-medium">Email Address</p>
                <p className="text-white text-sm bg-[#0A0F14] border border-white/5 rounded-xl px-4 py-3">{userEmail}</p>
              </div>

              {/* Phone — editable */}
              <div>
                <p className="text-gray-500 text-xs mb-1 font-medium">Phone / WhatsApp</p>
                {editMode ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-white text-sm bg-[#0A0F14] border border-emerald-500/50 rounded-xl px-4 py-3 focus:border-emerald-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-white text-sm bg-[#0A0F14] border border-white/5 rounded-xl px-4 py-3">
                    {client.phone || <span className="text-gray-500">Not set</span>}
                  </p>
                )}
              </div>

              {/* Goal — editable */}
              <div>
                <p className="text-gray-500 text-xs mb-1 font-medium">Health Goal</p>
                {editMode ? (
                  <input
                    type="text"
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    placeholder="e.g. Lose weight, build energy..."
                    className="w-full text-white text-sm bg-[#0A0F14] border border-emerald-500/50 rounded-xl px-4 py-3 focus:border-emerald-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-white text-sm bg-[#0A0F14] border border-white/5 rounded-xl px-4 py-3">
                    {client.assessment_goal || <span className="text-gray-500">Not set</span>}
                  </p>
                )}
              </div>

              {/* Plan info — read-only */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-gray-500 text-xs mb-1 font-medium">Plan Start</p>
                  <p className="text-white text-sm bg-[#0A0F14] border border-white/5 rounded-xl px-4 py-3">
                    {client.plan_start_date ? formatDate(client.plan_start_date) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1 font-medium">Sessions Left</p>
                  <p className="text-white text-sm bg-[#0A0F14] border border-white/5 rounded-xl px-4 py-3">
                    {client.sessions_remaining} / {client.sessions_total}
                  </p>
                </div>
              </div>
            </div>

            {editMode && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}

            {saveSuccess && (
              <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle size={14} /> Profile updated successfully
              </div>
            )}
          </motion.div>
        )}

        {/* ── My Bookings Tab ── */}
        {activeTab === 'bookings' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Session tracker */}
            <div className="bg-[#111820] border border-white/[0.08] rounded-2xl p-5">
              <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-4">Session Progress</p>
              <div className="flex items-center gap-3 mb-3">
                {Array.from({ length: client.sessions_total }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-colors ${
                      i < client.sessions_used ? 'bg-emerald-500' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-400 text-xs">
                {client.sessions_used} of {client.sessions_total} sessions completed
                {client.sessions_remaining > 0 && ` · ${client.sessions_remaining} remaining`}
              </p>
            </div>

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-3 px-1">Upcoming</p>
                <div className="space-y-3">
                  {upcoming.map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt} />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-3 px-1 mt-5">Past Sessions</p>
                <div className="space-y-3">
                  {past.map((appt) => (
                    <AppointmentCard key={appt.id} appt={appt} />
                  ))}
                </div>
              </div>
            )}

            {appointments.length === 0 && (
              <div className="bg-[#111820] border border-white/[0.08] rounded-2xl p-10 text-center">
                <CalendarDays className="text-gray-600 mx-auto mb-3" size={36} />
                <p className="text-gray-400 text-sm">No sessions booked yet</p>
                <button
                  onClick={() => router.push('/booking/new')}
                  className="mt-4 bg-emerald-500 text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-400 transition"
                >
                  Book a Session
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Manage Tab ── */}
        {activeTab === 'manage' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="bg-[#111820] border border-white/[0.08] rounded-2xl p-5">
              <p className="text-white font-bold mb-1">Manage Sessions</p>
              <p className="text-gray-400 text-sm mb-5">Cancel or reschedule your upcoming sessions below.</p>

              {upcoming.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="text-gray-600 mx-auto mb-3" size={32} />
                  <p className="text-gray-400 text-sm">No active sessions to manage</p>
                  <button
                    onClick={() => router.push('/booking/new')}
                    className="mt-4 bg-emerald-500 text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-400 transition"
                  >
                    Book a Session
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((appt) => {
                    const badge = STATUS_BADGE[appt.status] || STATUS_BADGE.pending
                    const canCancel = ['pending', 'confirmed'].includes(appt.status)
                    return (
                      <div key={appt.id} className="bg-[#0A0F14] border border-white/5 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold border rounded-full px-2.5 py-0.5 ${badge.className}`}>
                                {badge.label}
                              </span>
                              <span className="text-gray-500 text-xs">Session #{appt.session_number}</span>
                            </div>
                            <p className="text-white font-medium text-sm">
                              {formatDate(appt.scheduled_date)}, {formatTime(appt.scheduled_time)}
                            </p>
                            {appt.nutritionists?.name && (
                              <p className="text-gray-500 text-xs mt-0.5">with {appt.nutritionists.name}</p>
                            )}
                          </div>
                          {canCancel && (
                            <button
                              onClick={() => handleCancel(appt.id)}
                              disabled={isPending && cancellingId === appt.id}
                              className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-red-400 border border-red-500/30 rounded-xl px-3 py-2 hover:bg-red-500/10 transition disabled:opacity-50"
                            >
                              {isPending && cancellingId === appt.id ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : (
                                <XCircle size={12} />
                              )}
                              Cancel
                            </button>
                          )}
                        </div>

                        {canCancel && (
                          <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                            <button
                              onClick={() => router.push('/booking/new')}
                              className="flex-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 rounded-xl py-2 hover:bg-emerald-500/10 transition"
                            >
                              Reschedule
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/booking/new')}
                className="bg-[#111820] border border-white/[0.08] rounded-2xl p-4 text-left hover:border-emerald-500/30 transition group"
              >
                <CalendarDays className="text-emerald-400 mb-2" size={20} />
                <p className="text-white font-bold text-sm">Book Session</p>
                <p className="text-gray-500 text-xs mt-0.5">Schedule your next appointment</p>
              </button>
              <button
                onClick={() => router.push('/assessment')}
                className="bg-[#111820] border border-white/[0.08] rounded-2xl p-4 text-left hover:border-white/20 transition"
              >
                <ClipboardCheck className="text-blue-400 mb-2" size={20} />
                <p className="text-white font-bold text-sm">Retake Assessment</p>
                <p className="text-gray-500 text-xs mt-0.5">Update your health profile</p>
              </button>
            </div>
          </motion.div>
        )}
      </div>{/* end left content */}

      {/* ── Right: image + profile sidebar (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[360px] lg:border-l lg:border-white/5 flex-col overflow-hidden relative bg-[#090d0a]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80"
          alt="Healthy food"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 flex flex-col h-full px-8 py-10 gap-6">

          {/* Profile card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-black font-black text-xl shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold truncate">{displayName}</p>
                <p className="text-gray-400 text-xs truncate">{userEmail}</p>
                <div className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  client.status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                }`}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)} Plan
                </div>
              </div>
            </div>
          </div>

          {/* Session stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Sessions', value: appointments.length },
              { label: 'Upcoming', value: upcoming.length },
              { label: 'Completed', value: past.filter(a => a.status === 'completed').length },
              { label: 'Plan Status', value: client.status === 'active' ? 'Active' : 'Inactive' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white font-black text-xl">{value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="mt-auto space-y-2">
            <button
              onClick={() => router.push('/booking/new')}
              className="w-full flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl px-4 py-3 text-sm transition"
            >
              <CalendarDays size={16} />
              Book a Session
            </button>
            <button
              onClick={() => router.push('/booking/dashboard')}
              className="w-full flex items-center gap-3 border border-white/10 text-gray-300 hover:text-white hover:border-white/30 font-medium rounded-xl px-4 py-3 text-sm transition"
            >
              View My Dashboard
            </button>
          </div>

          <p className="text-gray-600 text-xs text-center">
            Your data is encrypted and secure.
          </p>
        </div>
      </div>

      </div>{/* end desktop 2-col */}
    </div>
  )
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const badge = STATUS_BADGE[appt.status] || STATUS_BADGE.pending
  return (
    <div className="bg-[#111820] border border-white/[0.08] rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${badge.className}`}>
        {appt.status === 'completed' && <ClipboardCheck size={16} />}
        {appt.status === 'confirmed' && <CheckCircle size={16} />}
        {appt.status === 'pending' && <Clock size={16} />}
        {(appt.status === 'rejected' || appt.status === 'cancelled') && <XCircle size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-medium text-sm">
            {formatDate(appt.scheduled_date)}, {formatTime(appt.scheduled_time)}
          </p>
          <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-gray-500 text-xs mt-0.5">Session #{appt.session_number}</p>
      </div>
    </div>
  )
}
