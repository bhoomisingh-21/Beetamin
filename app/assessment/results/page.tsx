'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  Sparkles,
  ArrowDown,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='70' viewBox='0 0 60 70'>
  <path d='M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z' fill='none' stroke='#22C55E' stroke-width='0.5' stroke-opacity='0.25'/>
</svg>`
const HEX_URL = `data:image/svg+xml,${encodeURIComponent(HEX_SVG)}`

function getScoreLabel(score: number) {
  if (score <= 25) return { label: 'Healthy Profile', color: '#10b981', bg: 'bg-emerald-500/20 text-emerald-400' }
  if (score <= 45) return { label: 'Mild Risk', color: '#f59e0b', bg: 'bg-yellow-500/20 text-yellow-400' }
  if (score <= 65) return { label: 'Moderate Risk', color: '#f97316', bg: 'bg-orange-500/20 text-orange-400' }
  return { label: 'High Risk', color: '#ef4444', bg: 'bg-red-500/20 text-red-400' }
}

function getPersonalizedHeadline(score: number, name: string, deficiencies: any[]) {
  const firstName = name || 'there'
  if (score <= 25) {
    return {
      main: `Hi ${firstName}, great news —`,
      sub: `your nutrient profile looks strong.`,
      subtext: `Your answers suggest your body is getting what it needs. That said, even small gaps compound over time — here's what we found and how to stay ahead.`,
      transition: `HERE'S HOW TO KEEP IT THIS WAY`,
    }
  }
  if (score <= 45) {
    const nutrient = deficiencies?.[0]?.nutrient || 'key nutrients'
    return {
      main: `Hi ${firstName}, your body is`,
      sub: `showing early warning signs.`,
      subtext: `Your ${nutrient} levels appear to be slipping. These aren't dramatic symptoms yet — but early gaps always grow quietly before they become impossible to ignore.`,
      transition: `HERE'S WHAT YOU CAN DO TODAY`,
    }
  }
  if (score <= 65) {
    return {
      main: `Hi ${firstName}, your body has`,
      sub: `been running on empty.`,
      subtext: `The fatigue, the fog, the symptoms you've normalized — they're not random. Your answers point to real, fixable deficiencies that are draining your energy and performance daily.`,
      transition: `HERE ARE 3 WAYS TO START FIXING THIS`,
    }
  }
  return {
    main: `Hi ${firstName}, your body is`,
    sub: `quietly struggling — and it's fixable.`,
    subtext: `What you're experiencing isn't aging. It isn't stress. Your cells are running critically low on the nutrients they need to function — and every day without intervention makes it harder to recover.`,
    transition: `START HERE — YOUR IMMEDIATE ACTIONS`,
  }
}

function getSeverityBadge(severity: string) {
  if (severity === 'high') return 'bg-red-500/20 text-red-400 border border-red-500/20'
  if (severity === 'medium') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
  return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
}

function getOfferHeadline(score: number, name: string, deficiencies: any[]) {
  const firstName = name || 'you'
  if (score <= 25) {
    return {
      h2: `Protect What's Working.`,
      h2sub: `Build on It.`,
      desc: `${firstName}'s profile is healthy — but optimal is different from average. Your ₹29 plan locks in your current status and builds the margins that prevent future gaps.`,
    }
  }
  const topNutrient = deficiencies?.[0]?.nutrient || 'your deficiencies'
  if (score <= 45) {
    return {
      h2: `Catch It Early.`,
      h2sub: `Fix It Permanently.`,
      desc: `${firstName}'s ${topNutrient} gap is early-stage — the easiest and cheapest time to fix it. Your ₹29 plan gives you the exact protocol before it becomes a real problem.`,
    }
  }
  return {
    h2: `Your Deficiencies Won't Fix Themselves.`,
    h2sub: `This Plan Will.`,
    desc: `Based on ${firstName}'s ${deficiencies?.length || 'identified'} deficiencies — especially ${topNutrient} — our doctors have built a 90-day clinical protocol with the exact foods, dosages, and daily routine your body needs.`,
  }
}

export default function ResultsPage() {
  const [result, setResult] = useState<any>(null)
  const [meta, setMeta] = useState<any>({})
  const [scoreAnimated, setScoreAnimated] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('assessmentResult')
    const storedMeta = localStorage.getItem('assessmentMeta')

    if (!stored) {
      router.push('/assessment')
      return
    }

    const parsed = JSON.parse(stored)
    setResult(parsed)
    setMeta(storedMeta ? JSON.parse(storedMeta) : {})

    let start = 0
    const target = parsed.deficiencyScore
    const interval = setInterval(() => {
      start += 2
      setScoreAnimated(Math.min(start, target))
      if (start >= target) clearInterval(interval)
    }, 25)

    return () => clearInterval(interval)
  }, [])

  if (!result) return (
    <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  )

  const scoreInfo = getScoreLabel(result.deficiencyScore)
  const headline = getPersonalizedHeadline(result.deficiencyScore, meta.name, result.primaryDeficiencies)
  const offerHeadline = getOfferHeadline(result.deficiencyScore, meta.name, result.primaryDeficiencies)
  const isHealthy = result.deficiencyScore <= 25
  const insightIcon = isHealthy ? CheckCircle : AlertTriangle
  const insightIconColor = isHealthy ? 'text-emerald-400' : 'text-red-500'

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay },
  })

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">

      {/* ===== SECTION 1 ===== */}
      <div
        className="relative px-6 pt-20 pb-20"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(16,185,129,0.06), transparent 60%), url("${HEX_URL}")`,
          backgroundSize: '100% 100%, 60px 70px',
        }}
      >
        <div className="max-w-7xl mx-auto">

          {/* PERSONALIZED HEADING */}
          <motion.div {...fadeUp(0)} className="text-center">
            <h1 className="text-4xl md:text-6xl font-black leading-tight">
              <span className="text-white/90">{headline.main}</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-transparent bg-clip-text">
                {headline.sub}
              </span>
            </h1>

            <div className="mt-6 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full px-5 py-2">
              <ShieldCheck size={14} />
              {isHealthy ? 'NUTRITIONIST-REVIEWED ANALYSIS' : 'DOCTOR-APPROVED RECOVERY PLAN AVAILABLE'}
            </div>
          </motion.div>

          {/* PERSONALIZED SUBTEXT */}
          <motion.p {...fadeUp(0.1)} className="mt-8 text-gray-400 text-lg text-center max-w-3xl mx-auto leading-relaxed">
            {headline.subtext}
          </motion.p>

          {/* DIET SUMMARY if exists */}
          {result.dietSummary && (
            <motion.div {...fadeUp(0.15)} className="mt-6 max-w-2xl mx-auto bg-[#121821] border border-white/5 rounded-2xl px-6 py-4 text-center">
              <p className="text-gray-400 text-sm leading-relaxed">
                <span className="text-emerald-400 font-semibold">Diet analysis: </span>
                {result.dietSummary}
              </p>
            </motion.div>
          )}

          {/* MAIN GRID */}
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12 mt-16">

            {/* LEFT SIDE — SCORE + DEFICIENCIES */}
            <motion.div {...fadeUp(0.2)} className="bg-[#121821] border border-white/5 p-8 md:p-10 rounded-3xl">

              {/* SCORE ROW */}
              <div className="flex items-end gap-3 mb-3">
                <span className="text-8xl md:text-9xl font-black leading-none" style={{ color: scoreInfo.color }}>
                  {scoreAnimated}
                </span>
                <div className="mb-3">
                  <span className="text-gray-500 text-2xl">/100</span>
                  <div className={`mt-2 text-xs font-bold px-3 py-1 rounded-full inline-block ${scoreInfo.bg}`}>
                    {scoreInfo.label}
                  </div>
                </div>
              </div>

              <p className="text-gray-500 text-xs uppercase tracking-widest mb-6">
                {isHealthy
                  ? `${meta.name || 'Your'}'s overall deficiency risk score`
                  : `${meta.name || 'Your'}'s nutrient deficiency risk score`}
              </p>

              {/* URGENCY MESSAGE */}
              {result.urgencyMessage && (
                <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${isHealthy ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
                  {result.urgencyMessage}
                </div>
              )}

              {/* DEFICIENCY CARDS */}
              <div className="space-y-4">
                {result.primaryDeficiencies?.length > 0 ? (
                  result.primaryDeficiencies.map((def: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="bg-[#0F141A] p-5 rounded-2xl border border-white/5"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-base text-white">{def.nutrient}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${getSeverityBadge(def.severity)}`}>
                          {def.severity} risk
                        </span>
                      </div>
                      <p className="text-gray-400 mt-2 text-sm leading-relaxed">{def.reason}</p>
                      {def.symptoms?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {def.symptoms.map((s: string, j: number) => (
                            <span key={j} className="bg-white/5 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-emerald-300 text-sm">
                    ✅ No significant deficiencies detected based on your answers.
                  </div>
                )}
              </div>
            </motion.div>

            {/* RIGHT SIDE — INSIGHTS */}
            <motion.div {...fadeUp(0.25)} className="flex flex-col justify-center gap-4">
              <p className={`text-xs font-bold tracking-widest uppercase ${isHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                {isHealthy ? `What's Working For ${meta.name || 'You'}` : `What This Is Doing To ${meta.name || 'You'}`}
              </p>

              {result.lifestyleInsights?.map((item: string, i: number) => {
                const Icon = insightIcon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex gap-4 bg-[#121821] p-5 rounded-2xl border border-white/5"
                  >
                    <Icon className={`${insightIconColor} flex-shrink-0 mt-0.5`} size={16} />
                    <p className="text-gray-300 text-sm leading-relaxed">{item}</p>
                  </motion.div>
                )
              })}
            </motion.div>

          </div>

          {/* TRANSITION */}
          <motion.div {...fadeUp(0.3)} className="text-center mt-20">
            <p className="text-emerald-400 font-black tracking-widest text-sm">
              {headline.transition}
            </p>
            <div className="mt-6 flex justify-center">
              <div className="animate-bounce bg-emerald-500/10 p-4 rounded-full">
                <ArrowDown className="text-emerald-400" />
              </div>
            </div>
          </motion.div>

          {/* QUICK WINS STEPS */}
          <motion.div {...fadeUp(0.35)} className="mt-16 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-[2rem] p-8 md:p-12 max-w-5xl mx-auto">
            <p className="text-center text-xs tracking-widest text-emerald-400 mb-2 font-bold uppercase">
              {isHealthy ? 'Optimize & Maintain' : 'Immediate Corrective Actions'}
            </p>
            <p className="text-center text-gray-500 text-sm mb-10">
              {isHealthy
                ? `Specific to ${meta.name || 'your'}'s current profile`
                : `Personalized for ${meta.name || 'your'}'s deficiency pattern`}
            </p>

            <div className="space-y-8">
              {result.quickWins?.map((win: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-center gap-6 group"
                >
                  <div className="w-14 h-14 bg-emerald-500 text-black rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-base md:text-lg font-semibold flex-1 group-hover:text-emerald-300 transition leading-relaxed">
                    {win}
                  </p>
                  <ArrowRight className="text-emerald-400 opacity-40 group-hover:opacity-100 flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* BRIDGE */}
          <motion.div {...fadeUp(0.4)} className="text-center mt-14 max-w-2xl mx-auto">
            <p className="text-lg text-gray-300">
              {isHealthy
                ? `These habits help — `
                : `These steps will help — `}
              <span className="text-white font-semibold">
                {isHealthy
                  ? `but a full personalized protocol takes ${meta.name || 'you'} from good to optimal.`
                  : `but they won't fully fix ${meta.name || 'your'}'s root deficiencies.`}
              </span>
            </p>
            <p className="mt-4 text-emerald-400 font-bold text-sm">
              {isHealthy
                ? `Want a complete optimization plan built for your profile?`
                : `Want a complete recovery plan built around your exact deficiencies?`}
            </p>
            <div className="mt-6 flex justify-center">
              <div className="animate-bounce bg-emerald-500/10 p-3 rounded-full">
                <ArrowDown className="text-emerald-400" />
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ===== SECTION 2 — OFFER ===== */}
      <div className="bg-white text-black px-6 py-24 rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">

          {/* LEFT */}
          <motion.div {...fadeUp(0)}>
            <h2 className="text-4xl md:text-5xl font-black leading-tight">
              {offerHeadline.h2}
              <span className="block text-emerald-600 mt-2">
                {offerHeadline.h2sub}
              </span>
            </h2>

            <p className="mt-6 text-gray-600 text-lg leading-relaxed">
              {offerHeadline.desc}
            </p>

            <div className="grid grid-cols-3 mt-12 gap-6 md:gap-10">
              <div>
                <p className="text-2xl md:text-3xl font-black">50,000+</p>
                <p className="text-sm text-gray-500">Indians helped</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black">94%</p>
                <p className="text-sm text-gray-500">Success rate</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-emerald-600">₹29</p>
                <p className="text-sm text-gray-500">One time</p>
              </div>
            </div>

            <div className="mt-12 bg-gray-50 p-8 md:p-10 rounded-2xl">
              <p className="text-xs font-bold mb-6 text-gray-400 uppercase">
                {`${meta.name || 'Your'}'s 90-Day Protocol Includes`}
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  result.primaryDeficiencies?.[0]?.nutrient
                    ? `${result.primaryDeficiencies[0].nutrient} recovery meal plan`
                    : 'Personalized 90-day meal plan',
                  'Exact supplement list with dosages',
                  `Daily routine for ${meta.goal || 'your goal'}`,
                  'Foods actively worsening your levels',
                  'WhatsApp nutritionist check-in',
                  'Doctor-reviewed & signed off',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* RIGHT — PRICING CARD */}
          <motion.div {...fadeUp(0.1)} className="bg-white border rounded-3xl p-8 md:p-12 shadow-2xl text-center relative overflow-hidden">

            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10">
              <p className="text-red-500 text-xs font-bold tracking-widest uppercase mb-4">
                🔥 New User Offer — Expires Soon
              </p>

              <p className="line-through text-gray-400 text-lg">₹299</p>
              <p className="text-7xl font-black mt-1">₹29</p>
              <p className="text-emerald-600 text-sm font-semibold mt-2">
                {isHealthy
                  ? `Optimization plan for ${meta.name || 'you'}`
                  : `Recovery plan for ${meta.name || 'you'}'s ${result.primaryDeficiencies?.[0]?.nutrient || 'deficiencies'}`}
              </p>

              <div className="mt-6">
                <p className="text-sm text-gray-500 font-medium">Secure Payment via Razorpay</p>
                <div className="flex justify-center items-center gap-4 mt-4 flex-wrap">
                  <img src="https://cdn.simpleicons.org/googlepay" className="h-6" alt="Google Pay" />
                  <img src="https://cdn.simpleicons.org/phonepe" className="h-6" alt="PhonePe" />
                  <img src="https://cdn.simpleicons.org/paytm" className="h-6" alt="Paytm" />
                  <img src="https://cdn.simpleicons.org/visa" className="h-6" alt="Visa" />
                  <img src="https://cdn.simpleicons.org/mastercard" className="h-6" alt="Mastercard" />
                </div>
              </div>

              <p className="mt-6 text-xs text-gray-500">
                Trusted by <span className="font-bold text-black">50,000+ Indians</span>
              </p>

              <button className="mt-8 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-black py-5 rounded-xl font-black text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                🔒 GET MY PERSONALIZED PLAN
              </button>

              <p className="mt-4 text-xs text-gray-400">
                🔐 100% Secure • No hidden charges • Instant access
              </p>

              <div className="mt-4 flex justify-center gap-4 text-[10px] text-gray-400">
                <span>✔ Safe Checkout</span>
                <span>✔ Instant Delivery</span>
                <span>✔ Verified Plan</span>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-gray-400 text-xs">Not sure?</p>
                <a href="tel:+919022234475" className="text-emerald-600 font-medium text-sm mt-1 block hover:text-emerald-500 transition">
                  Talk to a nutritionist free →
                </a>
                <button
                  onClick={() => { localStorage.clear(); router.push('/assessment') }}
                  className="text-gray-300 text-xs mt-3 underline cursor-pointer hover:text-gray-400 transition block mx-auto"
                >
                  Retake assessment
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

    </div>
  )
}