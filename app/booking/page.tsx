'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import {
  CheckCircle, Loader2, Calendar, Clock,
  Shield, Star, ArrowRight, Leaf, User,
} from 'lucide-react'
import { getClientByClerkId, saveAssessmentToProfile } from '@/lib/booking-actions'

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='70' viewBox='0 0 60 70'><path d='M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z' fill='none' stroke='%2322C55E' stroke-width='0.5' stroke-opacity='0.18'/></svg>`
const HEX_URL = `data:image/svg+xml,${encodeURIComponent(HEX_SVG.replace(/'/g, '%27'))}`

const PLAN_FEATURES = [
  { icon: Calendar, label: '6 Expert Sessions', sub: '30 min each, over 3 months' },
  { icon: Clock, label: 'Flexible Scheduling', sub: 'Book at times that suit you' },
  { icon: Shield, label: 'Doctor-Reviewed Plans', sub: 'Clinically validated guidance' },
  { icon: Star, label: 'Personalized Protocol', sub: 'Built around your deficiencies' },
]

const INCLUDES = [
  'Bi-weekly 1-on-1 sessions with a certified nutritionist',
  'Personalized vitamin & supplement plan after Session 1',
  'Diet plan tailored to your health conditions & goals',
  'WhatsApp support between sessions',
  'Session notes & recordings for future reference',
  'Reminders 24 hours and 1 hour before every session',
]

export default function BookingPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return

    // Safety fallback: if redirect hasn't fired in 5 seconds, go to onboard
    const fallback = setTimeout(() => {
      router.push('/booking/onboard')
    }, 5000)

    ;(async () => {
      try {
        const assessmentResult = localStorage.getItem('assessmentResult')
        const assessmentMeta = localStorage.getItem('assessmentMeta')

        // Recovery-plan flow from results: go to extra questions first (skip purchase page for now)
        const postLoginDest = sessionStorage.getItem('postLoginDest')
        if (postLoginDest === '29-plan') {
          sessionStorage.removeItem('postLoginDest')
          if (assessmentResult && user?.id) {
            try {
              await saveAssessmentToProfile({
                clerkUserId: user.id,
                assessmentResult: JSON.parse(assessmentResult) as unknown,
                assessmentMeta: assessmentMeta ? (JSON.parse(assessmentMeta) as unknown) : null,
              })
              localStorage.removeItem('assessmentResult')
              localStorage.removeItem('assessmentMeta')
            } catch {
              // keep localStorage if persist fails so /detailed-assessment can still read it
            }
          }
          clearTimeout(fallback)
          router.push('/detailed-assessment')
          return
        }

        if (assessmentResult && user?.id) {
          try {
            await saveAssessmentToProfile({
              clerkUserId: user.id,
              assessmentResult: JSON.parse(assessmentResult) as unknown,
              assessmentMeta: assessmentMeta ? (JSON.parse(assessmentMeta) as unknown) : null,
            })
            localStorage.removeItem('assessmentResult')
            localStorage.removeItem('assessmentMeta')
          } catch {
            // keep localStorage if persist fails (e.g. offline); user can retry
          }
        }

        // Regular users (Clerk) are NEVER nutritionists — nutritionists use Supabase auth
        const client = await getClientByClerkId(user.id)
        clearTimeout(fallback)
        if (client) {
          router.push('/sessions')
        } else {
          router.push('/booking/onboard')
        }
      } catch {
        clearTimeout(fallback)
        router.push('/booking/onboard')
      }
    })()

    return () => clearTimeout(fallback)
  }, [isLoaded, isSignedIn, user, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    )
  }

  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-emerald-400" size={28} />
        <p className="text-gray-400 text-sm">Loading your dashboard...</p>
      </div>
    )
  }

  // ── UNAUTHENTICATED VIEW ─────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#0A0F14]"
      style={{
        backgroundImage: `url("${HEX_URL}")`,
        backgroundSize: '60px 70px',
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Nav bar */}
      <div className="sticky top-0 z-10 bg-[#0A0F14]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <Leaf className="text-emerald-500" size={18} />
          <span className="text-white font-bold">TheBeetamin</span>
        </a>
        <a
          href="/sign-in?after=%2Fbooking"
          className="flex items-center gap-2 border border-white/20 text-gray-300 text-sm rounded-full px-4 py-2 hover:border-white/40 hover:text-white transition"
        >
          <User size={14} />
          Sign in
        </a>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center pt-14 pb-8 px-4 max-w-3xl mx-auto"
      >
        <span className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full px-4 py-1.5 mb-5">
          🌿 THE CORE TRANSFORMATION PLAN
        </span>
        <h1 className="text-white font-black text-4xl md:text-5xl leading-tight">
          Fix Your Deficiencies
          <br />
          <span className="text-[#00E676]">In 90 Days.</span>
        </h1>
       <br /><br />
      </motion.div>

      {/* ── Side-by-side layout ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="max-w-5xl mx-auto px-4 pb-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ─ LEFT: Plan info ─ */}
          <div className="space-y-6">
            {/* Feature tiles */}
            <div className="grid grid-cols-2 gap-3">
              {PLAN_FEATURES.map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="bg-[#111820] border border-white/[0.08] rounded-2xl p-4"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center mb-2">
                    <Icon className="text-emerald-400" size={16} />
                  </div>
                  <p className="text-white font-bold text-sm">{label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* What's included */}
            <div className="bg-[#111820] border border-white/[0.08] rounded-2xl p-6">
              <h3 className="text-white font-bold text-base mb-4">Everything included in ₹3,999</h3>
              <div className="space-y-2.5">
                {INCLUDES.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                    <span className="text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─ RIGHT: Sign-in / booking card ─ */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-1">
                <span className="text-gray-900 font-black text-5xl">₹3,999</span>
                <span className="text-gray-400 text-xl line-through">₹6,999</span>
              </div>
              <p className="text-gray-500 text-center text-xs sm:text-sm whitespace-nowrap max-md:tracking-tight">
                One-time · 3 months access · 6 sessions
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-4 text-amber-700 text-xs sm:text-sm font-medium text-center whitespace-nowrap max-md:tracking-tight">
                🔥 42% off — Limited spots available
              </div>

              <a
                href="/sign-in?after=%2Fbooking"
                className="mt-5 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg rounded-2xl py-4 transition flex items-center justify-center gap-2"
              >
                Get Started — ₹3,999
                <ArrowRight size={20} />
              </a>

              <a
                href="/sign-up?after=%2Fbooking"
                className="mt-3 block text-center text-emerald-600 hover:text-emerald-500 text-sm font-semibold"
              >
                New here? Create an account
              </a>

              <p className="text-gray-400 text-[10px] sm:text-xs mt-3 text-center whitespace-nowrap max-md:tracking-tight">
                Sign in with Google · No payment until you confirm
              </p>

              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <Shield size={12} className="text-emerald-500" />
                  100% secure
                </span>
                <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <CheckCircle size={12} className="text-emerald-500" />
                  Certified nutritionists
                </span>
                <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <Star size={12} className="text-emerald-500" />
                  50K+ clients
                </span>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-xs mb-1">Already have a plan?</p>
                <a
                  href="/sign-in?after=%2Fsessions"
                  className="text-emerald-600 hover:text-emerald-500 text-sm font-semibold underline inline-block"
                >
                  Sign in to your dashboard →
                </a>
              </div>
            </div>

            {/* Also take assessment */}
            <div className="mt-4 bg-[#111820] border border-emerald-500/20 rounded-2xl p-5 text-center">
              <p className="text-gray-400 text-sm mb-3">Not sure yet? Take our free health assessment first.</p>
              <a
                href="/assessment"
                className="inline-flex items-center gap-2 border border-emerald-500/40 text-emerald-400 font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-emerald-500/10 transition"
              >
                Free Health Assessment →
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
