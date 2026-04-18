'use client'

import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, ClipboardList, LayoutDashboard } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='70' viewBox='0 0 60 70'><path d='M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z' fill='none' stroke='%2322C55E' stroke-width='0.5' stroke-opacity='0.18'/></svg>`
const HEX_URL = `data:image/svg+xml,${encodeURIComponent(HEX_SVG.replace(/'/g, '%27'))}`

const PLAN_HIGHLIGHTS = [
  '6 expert 1-on-1 nutrition sessions',
  'Personalized vitamin & supplement plan',
  'Diet plan tailored to your health conditions',
  'WhatsApp support between sessions',
  'Doctor-reviewed, clinically validated guidance',
  '3 months validity · ₹3,999 one-time',
]

export default function BookingCTA() {
  const { isSignedIn } = useUser()

  return (
    <section
      id="booking"
      className="bg-[#0A0F14] py-20 sm:py-28"
      style={{
        backgroundImage: `url("${HEX_URL}")`,
        backgroundSize: '60px 70px',
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full px-4 py-1.5 mb-5">
            🌿 {isSignedIn ? 'CONTINUE YOUR TRANSFORMATION' : 'START YOUR TRANSFORMATION'}
          </span>
          <h2 className="font-black text-4xl sm:text-5xl leading-tight">
            {isSignedIn ? (
              <>
                <span className="text-white block">Continue Your</span>
                <span className="text-[#00E676] block">Transformation</span>
              </>
            ) : (
              <>
                <span className="text-white block">Ready to Fix Your</span>
                <span className="text-[#00E676] block">Deficiencies For Good?</span>
              </>
            )}
          </h2>
          <p className="text-gray-400 text-lg mt-4 max-w-xl mx-auto">
            {isSignedIn
              ? 'Your sessions are active. Keep going and track your progress below.'
              : 'Book your first session with a certified nutritionist. 6 sessions. 3 months. Real results.'}
          </p>
        </motion.div>

        {/* Two-column layout: info left, cards right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* ─ Left: What you get ─ */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-white font-black text-2xl mb-6">
              Everything in The Core Transformation
            </h3>
            <ul className="space-y-3 mb-8">
              {PLAN_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-300 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            {isSignedIn ? (
              <a
                href="/booking/dashboard"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl px-8 py-4 transition text-base"
              >
                <LayoutDashboard size={18} />
                View My Sessions
                <ArrowRight size={18} />
              </a>
            ) : (
              <a
                href="/booking"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl px-8 py-4 transition text-base"
              >
                Book Your Sessions
                <ArrowRight size={18} />
              </a>
            )}
          </motion.div>

          {/* ─ Right: Two CTA cards ─ */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Free Assessment / My Results */}
            <div className="bg-[#111820] border border-emerald-500/30 rounded-3xl p-6 hover:border-emerald-500 transition">
              <span className="bg-emerald-500 text-black text-xs font-bold rounded-full px-3 py-1">
                {isSignedIn ? 'YOUR RESULTS' : 'FREE'}
              </span>
              <h3 className="text-white font-black text-xl mt-3">
                {isSignedIn ? 'Your Assessment Results' : 'Free Health Assessment'}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {isSignedIn
                  ? 'View your personalized deficiency report'
                  : 'Discover your hidden deficiencies in 2 minutes'}
              </p>
              <a
                href={isSignedIn ? "/booking/profile" : "/assessment"}
                className="inline-flex items-center gap-2 bg-emerald-500 text-black font-bold rounded-full px-5 py-2.5 mt-4 hover:bg-emerald-400 transition text-sm"
              >
                <ClipboardList size={14} />
                {isSignedIn ? 'See My Results' : 'Start Free Assessment'}
              </a>
            </div>

            {/* Core Transformation / Active Plan */}
            <div className="bg-[#111820] border border-white/10 rounded-3xl p-6 hover:border-white/30 transition">
              <span className="bg-white/10 text-white text-xs font-bold rounded-full px-3 py-1">
                {isSignedIn ? '✅ PLAN ACTIVE' : '₹3,999 · Limited spots'}
              </span>
              <h3 className="text-white font-black text-xl mt-3">
                {isSignedIn ? 'Your Plan is Active' : 'The Core Transformation'}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {isSignedIn
                  ? 'Track your progress and manage your sessions'
                  : '6 expert sessions over 3 months — real results'}
              </p>
              {!isSignedIn && (
                <ul className="mt-3 space-y-1.5">
                  {['Doctor-reviewed guidance', 'Personalized supplement plan', 'WhatsApp nutritionist support'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle className="text-emerald-500 shrink-0" size={13} />
                      <span className="text-gray-300 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              <a
                href={isSignedIn ? "/booking/dashboard" : "/booking"}
                className="inline-flex items-center gap-2 border border-white/20 text-white font-bold rounded-full px-5 py-2.5 mt-4 hover:border-emerald-500 hover:text-emerald-400 transition text-sm"
              >
                {isSignedIn ? (
                  <><LayoutDashboard size={14} /> Go to Dashboard</>
                ) : (
                  <>Book Sessions</>
                )}
                <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
