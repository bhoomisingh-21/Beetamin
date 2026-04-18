'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, UserButton } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, Calendar, Lock, Loader2, AlertTriangle, Plus, User } from 'lucide-react'
import { getClientDashboard, type ClientRow, type AppointmentRow } from '@/lib/booking-actions'

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='70' viewBox='0 0 60 70'><path d='M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z' fill='none' stroke='%2322C55E' stroke-width='0.5' stroke-opacity='0.18'/></svg>`
const HEX_URL = `data:image/svg+xml,${encodeURIComponent(HEX_SVG.replace(/'/g, '%27'))}`

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

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${String(m).padStart(2, '0')} ${period}`
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [data, setData] = useState<{ client: ClientRow; appointments: AppointmentRow[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user) return
    getClientDashboard(user.id)
      .then((result) => {
        if (!result) {
          router.push('/booking/onboard')
          return
        }
        setData(result as { client: ClientRow; appointments: AppointmentRow[] })
      })
      .finally(() => setIsLoading(false))
  }, [isLoaded, user, router])

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    )
  }

  if (!data) return null

  const { client, appointments } = data
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(client.plan_end_date).getTime() - Date.now()) / 86400000)
  )
  const progressPct = (client.sessions_used / client.sessions_total) * 100

  // Active appointment (pending or confirmed) — at most 1
  const activeAppt = appointments.find((a) => a.status === 'pending' || a.status === 'confirmed')
  const confirmedAppts = appointments.filter((a) => a.status === 'confirmed')
  const completedAppts = appointments.filter((a) => a.status === 'completed')
  const rejectedAppts = appointments.filter((a) => a.status === 'rejected')

  const canBook =
    client.status === 'active' &&
    client.sessions_remaining > 0 &&
    !activeAppt

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
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <a href="/" className="flex items-center gap-1.5 text-gray-400 text-sm hover:text-white transition">
            <span className="text-lg">←</span> TheBeetamin
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/booking/profile"
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm border border-white/10 rounded-full px-3 py-1.5 hover:border-white/30 transition"
            >
              <User size={13} />
              Profile
            </a>
            <UserButton />
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-white font-black text-3xl md:text-4xl">
              Welcome back, {client.name.split(' ')[0]}
            </h1>
            {statusBadge(client.status)}
          </div>
        </motion.div>

        {/* Session progress */}
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

          {/* 6 Session circles */}
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
                    <p className="text-blue-400 text-xs mt-1">Confirmed</p>
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

              // Bookable next session
              if (n === client.sessions_used + 1 && canBook) {
                return (
                  <div
                    key={n}
                    onClick={() => router.push('/booking/new')}
                    className="bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl p-4 text-center cursor-pointer hover:bg-emerald-500/20 transition"
                  >
                    <Calendar className="text-emerald-400 mx-auto" size={24} />
                    <p className="text-emerald-300 font-bold text-sm mt-1">Session {n}</p>
                    <p className="text-emerald-400 text-xs mt-1">Book now</p>
                  </div>
                )
              }

              return (
                <div key={n} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-center opacity-40">
                  <Lock className="text-gray-600 mx-auto" size={24} />
                  <p className="text-gray-600 font-bold text-sm mt-1">Session {n}</p>
                  <p className="text-gray-600 text-xs mt-1">Locked</p>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* CTA — Book next session */}
        {canBook && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            onClick={() => router.push('/booking/new')}
            className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg rounded-2xl py-5 transition flex items-center justify-center gap-2"
          >
            <Plus size={22} />
            Book Session {client.sessions_used + 1} →
          </motion.button>
        )}

        {/* Active appointment banner */}
        {activeAppt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={`mt-6 rounded-2xl p-5 border-2 ${
              activeAppt.status === 'confirmed'
                ? 'bg-blue-500/10 border-blue-500'
                : 'bg-amber-500/10 border-amber-500'
            }`}
          >
            <div className="flex items-start gap-3">
              {activeAppt.status === 'confirmed' ? (
                <Calendar className="text-blue-400 shrink-0 mt-0.5" size={20} />
              ) : (
                <Clock className="text-amber-400 shrink-0 mt-0.5" size={20} />
              )}
              <div>
                <p className={`font-bold text-sm ${activeAppt.status === 'confirmed' ? 'text-blue-300' : 'text-amber-300'}`}>
                  Session {activeAppt.session_number} —{' '}
                  {activeAppt.status === 'confirmed' ? 'Confirmed ✅' : 'Awaiting confirmation ⏳'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {formatDate(activeAppt.scheduled_date)} at {formatTime(activeAppt.scheduled_time)}
                  {(activeAppt as AppointmentRow & { nutritionists?: { name: string } }).nutritionists?.name && (
                    <> · {(activeAppt as AppointmentRow & { nutritionists?: { name: string } }).nutritionists!.name}</>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Rejected notice */}
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
              <p className="text-gray-400 text-sm mt-1">
                Please choose a different date or time slot.
              </p>
              <button
                onClick={() => router.push('/booking/new')}
                className="mt-3 bg-emerald-500 text-black font-bold rounded-full px-5 py-2 text-sm hover:bg-emerald-400 transition"
              >
                Book a New Slot →
              </button>
            </div>
          </motion.div>
        )}

        {/* Confirmed upcoming */}
        {confirmedAppts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-6 bg-[#111820] border border-white/[0.08] rounded-3xl p-6"
          >
            <h3 className="text-white font-bold text-lg mb-4">Upcoming Sessions</h3>
            {confirmedAppts.map((appt) => (
              <div key={appt.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <Calendar className="text-blue-400 shrink-0" size={16} />
                  <div>
                    <p className="text-white font-medium">Session {appt.session_number}</p>
                    <p className="text-gray-400 text-sm">
                      {formatDate(appt.scheduled_date)} · {formatTime(appt.scheduled_time)}
                    </p>
                  </div>
                </div>
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-3 py-1 text-xs font-bold">
                  Confirmed
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Past sessions */}
        {completedAppts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-6 bg-[#111820] border border-white/[0.08] rounded-3xl p-6 mb-8"
          >
            <h3 className="text-white font-bold text-lg mb-4">Past Sessions</h3>
            {completedAppts.map((appt) => (
              <div key={appt.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-emerald-400 shrink-0" size={16} />
                  <div>
                    <p className="text-white font-medium">Session {appt.session_number}</p>
                    <p className="text-gray-400 text-sm">
                      {formatDate(appt.scheduled_date)} · {formatTime(appt.scheduled_time)}
                    </p>
                    {appt.notes && (
                      <p className="text-gray-500 text-xs mt-1 italic">&ldquo;{appt.notes}&rdquo;</p>
                    )}
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-bold">
                  Completed
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
