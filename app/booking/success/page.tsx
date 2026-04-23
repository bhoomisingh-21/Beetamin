'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Leaf,
  Calendar,
  User,
  Plus,
  LayoutDashboard,
  Home,
  CheckCircle2,
  Mail,
  Bell,
  Sparkles,
} from 'lucide-react'
import { Suspense } from 'react'
import { useUser } from '@clerk/nextjs'

function SuccessContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { user } = useUser()

  const nutritionist = params.get('nutritionist') || 'Your nutritionist'
  const date = params.get('date') || ''
  const time = params.get('time') || ''

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header — match booking / onboard */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2">
          <Leaf className="text-emerald-500 shrink-0" size={18} />
          <span className="text-gray-900 font-bold">TheBeetamin</span>
        </a>
        <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => router.push('/booking/dashboard')}
            className="text-gray-500 hover:text-gray-800 text-sm font-medium transition"
          >
            My Sessions
          </button>
          {user?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full ring-2 ring-gray-100" />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Main */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-14 lg:py-16">
          <div className="w-full max-w-lg mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              {/* Success mark */}
              <div className="relative flex justify-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.08 }}
                  className="relative"
                >
                  <div className="absolute inset-0 rounded-full bg-emerald-400/25 blur-2xl scale-[1.35]" aria-hidden />
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/25 ring-4 ring-white">
                    <CheckCircle2 className="text-white w-14 h-14 sm:w-16 sm:h-16" strokeWidth={2} />
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-emerald-600 text-xs font-bold tracking-widest uppercase mb-2">
                  Request sent
                </p>
                <h1 className="text-gray-900 font-black text-2xl sm:text-3xl leading-tight">
                  You&apos;re all set — we&apos;ve got your{' '}
                  <span className="text-emerald-600">session request</span>
                </h1>
                <p className="text-gray-500 mt-3 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  Your nutritionist will review it and confirm. You&apos;ll hear from us soon.
                </p>
              </motion.div>

              {/* Details card */}
              {(nutritionist || date) && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                  className="mt-8 text-left bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-7"
                >
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-4">
                    Request summary
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <User className="text-emerald-600" size={20} />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-gray-500 text-xs font-medium">Nutritionist</p>
                        <p className="text-gray-900 font-semibold text-base mt-0.5">{nutritionist}</p>
                      </div>
                    </div>
                    {date && (
                      <div className="flex items-start gap-4 pt-1 border-t border-gray-100">
                        <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                          <Calendar className="text-sky-600" size={20} />
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-gray-500 text-xs font-medium">Date & time</p>
                          <p className="text-gray-900 font-semibold text-base mt-0.5">
                            {date}
                            {time ? <span className="text-gray-600 font-medium"> · {time}</span> : null}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* What happens next */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/60 px-5 py-5 sm:px-6 text-left"
              >
                <p className="text-emerald-800 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  What happens next
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                    <span>Your nutritionist reviews and confirms your slot.</span>
                  </li>
                  <li className="flex gap-3">
                    <Mail className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                    <span>Watch your inbox for a confirmation email (usually within 24 hours).</span>
                  </li>
                  <li className="flex gap-3">
                    <Bell className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                    <span>We&apos;ll remind you 24 hours and 1 hour before your session.</span>
                  </li>
                </ul>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52 }}
                className="mt-8 flex flex-col gap-3 max-w-sm mx-auto sm:max-w-none"
              >
                <button
                  type="button"
                  onClick={() => router.push('/booking/dashboard')}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl py-3.5 sm:py-4 transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <LayoutDashboard size={18} />
                  Go to My Sessions
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/booking/new')}
                  className="w-full border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300 rounded-2xl py-3.5 transition flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <Plus size={18} />
                  Book another session
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="w-full text-gray-500 hover:text-gray-800 rounded-2xl py-3 transition flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Home size={18} />
                  Back to home
                </button>
              </motion.div>

              <p className="text-gray-400 text-xs mt-8">
                Questions? We&apos;re at{' '}
                <a href="mailto:hi@thebeetamin.com" className="text-emerald-600 font-medium hover:underline">
                  hi@thebeetamin.com
                </a>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Side panel — desktop */}
        <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-[#0A1A10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&auto=format&fit=crop&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-widest uppercase rounded-full px-3 py-1 mb-6 w-fit">
              ✓ Request received
            </span>
            <h2 className="text-white font-black text-3xl leading-tight">
              Sit tight —
              <br />
              <span className="text-emerald-400">we&apos;ll handle the rest.</span>
            </h2>
            <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-sm">
              Your plan includes expert-led sessions and reminders, so you never miss a beat on your health journey.
            </p>
            <ul className="mt-10 space-y-4">
              {[
                'Pending → confirmed by your nutritionist',
                'Email updates at every step',
                'Session reminders before you go live',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
            <p className="text-gray-500 text-sm">Loading…</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
