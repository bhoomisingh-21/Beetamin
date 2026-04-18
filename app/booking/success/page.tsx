'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Leaf, Calendar, User, Plus, LayoutDashboard, ClipboardList, Home } from 'lucide-react'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const router = useRouter()

  const nutritionist = params.get('nutritionist') || 'Your Nutritionist'
  const date = params.get('date') || ''
  const time = params.get('time') || ''

  return (
    <div className="min-h-screen bg-[#0A0F14] flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-center border-b border-white/5">
        <a href="/" className="flex items-center gap-2">
          <Leaf className="text-emerald-500" size={18} />
          <span className="text-white font-bold">TheBeetamin</span>
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md text-center"
        >
          {/* Award badge animation */}
          <div className="relative flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.15 }}
              className="relative"
            >
              {/* Glow */}
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl scale-150" />
              {/* Main badge */}
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <svg viewBox="0 0 80 80" className="w-20 h-20" fill="none">
                  <circle cx="40" cy="36" r="24" fill="rgba(255,255,255,0.15)" />
                  <path d="M27 36l9 9 17-18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Ribbon */}
                  <path d="M30 60 L40 72 L50 60 L44 52 L40 56 L36 52 Z" fill="rgba(255,255,255,0.8)" />
                  <path d="M34 52 L40 56 L46 52" stroke="rgba(0,200,100,0.8)" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h1 className="text-white font-black text-3xl leading-tight">
              Your <span className="text-emerald-400">appointment request</span> has been
              successfully submitted!
            </h1>
            <p className="text-gray-400 mt-3">
              We&apos;ll be in touch shortly to confirm.
            </p>
          </motion.div>

          {/* Appointment details card */}
          {(nutritionist || date) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-7 bg-[#111820] border border-white/[0.08] rounded-2xl px-5 py-4"
            >
              <p className="text-gray-500 text-xs font-medium mb-3 text-left">Requested appointment details:</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Nutritionist */}
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <User className="text-emerald-400" size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-gray-500 text-[10px]">Nutritionist</p>
                    <p className="text-white font-semibold text-sm">{nutritionist}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-8 bg-white/10" />

                {/* Date & time */}
                {date && (
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Calendar className="text-blue-400" size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-gray-500 text-[10px]">Date & Time</p>
                      <p className="text-white font-semibold text-sm">{date}{time ? `, ${time}` : ''}</p>
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
            transition={{ delay: 0.65 }}
            className="mt-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl px-5 py-4 text-left"
          >
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">What happens next</p>
            <ul className="space-y-1.5 text-gray-400 text-sm">
              <li>✅ Your nutritionist reviews the request</li>
              <li>📧 You&apos;ll receive a confirmation email within 24 hours</li>
              <li>⏰ Reminders sent 24 hours and 1 hour before the session</li>
            </ul>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="mt-6 flex flex-col gap-3"
          >
            <button
              onClick={() => router.push('/booking/profile')}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl py-4 transition flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={18} />
              Manage My Sessions
            </button>
            <button
              onClick={() => router.push('/booking/new')}
              className="w-full border border-white/15 text-gray-300 hover:text-white hover:border-white/30 rounded-2xl py-3.5 transition flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus size={16} />
              Book Another Session
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full border border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20 rounded-2xl py-3.5 transition flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Home size={16} />
              Back to Home
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center">
        <div className="animate-spin text-emerald-400 text-2xl">●</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
