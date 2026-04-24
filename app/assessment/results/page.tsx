'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { getClientAssessmentFlags } from '@/lib/booking-actions'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  ArrowDown,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Loader2,
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
      desc: `${firstName}'s profile is healthy — but optimal is different from average. Your ₹39 plan locks in your current status and builds the margins that prevent future gaps.`,
    }
  }
  const topNutrient = deficiencies?.[0]?.nutrient || 'your deficiencies'
  if (score <= 45) {
    return {
      h2: `Catch It Early.`,
      h2sub: `Fix It Permanently.`,
      desc: `${firstName}'s ${topNutrient} gap is early-stage — the easiest and cheapest time to fix it. Your ₹39 plan gives you the exact protocol before it becomes a real problem.`,
    }
  }
  return {
    h2: `Your Deficiencies Won't Fix Themselves.`,
    h2sub: `This Plan Will.`,
    desc: `Based on ${firstName}'s ${deficiencies?.length || 'identified'} deficiencies — especially ${topNutrient} — our doctors have built a 90-day clinical protocol with the exact foods, dosages, and daily routine your body needs.`,
  }
}

type AssessmentFlags = Awaited<ReturnType<typeof getClientAssessmentFlags>>

export default function ResultsPage() {
  const [result, setResult] = useState<any>(null)
  const [meta, setMeta] = useState<any>({})
  const [scoreAnimated, setScoreAnimated] = useState(0)
  const [flags, setFlags] = useState<AssessmentFlags | null>(null)
  const router = useRouter()
  const { isSignedIn, user } = useUser()

  function handleRecoveryPlanCta() {
    if (!isSignedIn) {
      sessionStorage.setItem('postLoginDest', '29-plan')
      router.push('/sign-in')
      return
    }
    router.push('/detailed-assessment')
  }

  useEffect(() => {
    if (!isSignedIn || !user?.id) {
      setFlags(null)
      return
    }
    let cancelled = false
    getClientAssessmentFlags(user.id)
      .then((f) => {
        if (!cancelled) setFlags(f)
      })
      .catch(() => {
        if (!cancelled) setFlags(null)
      })
    return () => {
      cancelled = true
    }
  }, [isSignedIn, user?.id])

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

      {/* Back nav */}
      <div className="sticky top-0 z-10 bg-[#0B0F14]/90 backdrop-blur-md border-b border-white/5 px-3 py-2.5 md:px-4 md:py-3 flex items-center gap-2 md:gap-3">
        <a href="/assessment" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition">
          <ChevronLeft size={16} />
          Retake Assessment
        </a>
        <span className="flex-1" />
        <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition">← Home</a>
      </div>

      {/* ===== SECTION 1 ===== */}
      <div
        className="relative px-3 sm:px-4 md:px-6 pt-6 sm:pt-8 md:pt-20 pb-8 md:pb-20 max-md:pb-12"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(16,185,129,0.06), transparent 60%), url("${HEX_URL}")`,
          backgroundSize: '100% 100%, 60px 70px',
        }}
      >
        <div className="max-w-7xl mx-auto max-md:space-y-6 md:space-y-0">

          {/* HEADING */}
          <motion.div {...fadeUp(0)} className="text-center max-md:px-0.5">
            <p className="md:hidden text-[10px] font-bold tracking-[0.2em] text-emerald-400/90 uppercase mb-3">
              Your report
            </p>
            <h1 className="text-[1.35rem] leading-snug sm:text-3xl md:text-4xl lg:text-6xl font-black md:leading-tight">
              <span className="text-white/90">{headline.main}</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-transparent bg-clip-text">
                {headline.sub}
              </span>
            </h1>

            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-semibold rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
              <ShieldCheck size={12} />
              {isHealthy ? 'NUTRITIONIST-REVIEWED ANALYSIS' : 'DOCTOR-APPROVED RECOVERY PLAN AVAILABLE'}
            </div>
          </motion.div>

          {/* SUBTEXT */}
          <motion.p {...fadeUp(0.1)} className="mt-3 md:mt-8 text-gray-400 text-[13px] sm:text-base md:text-lg text-center max-w-3xl mx-auto leading-relaxed max-md:leading-relaxed px-0.5 md:px-1">
            {headline.subtext}
          </motion.p>

          {/* DIET SUMMARY */}
          {result.dietSummary && (
            <motion.div {...fadeUp(0.15)} className="mt-3 md:mt-6 max-w-2xl mx-auto bg-[#121821] border border-white/5 rounded-xl sm:rounded-2xl px-3.5 sm:px-6 py-3 sm:py-4 max-md:shadow-sm max-md:shadow-black/20">
              <p className="text-gray-400 text-[11px] sm:text-sm leading-relaxed text-center max-md:text-left">
                <span className="text-emerald-400 font-semibold">Diet analysis: </span>
                {result.dietSummary}
              </p>
            </motion.div>
          )}

          {/* ── MOBILE ONLY: Score card ── */}
          <motion.div {...fadeUp(0.18)} className="mt-4 md:hidden">
            <div className="bg-[#121821] border border-emerald-500/15 rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-black/30">
              <div className="flex-shrink-0">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black leading-none tabular-nums" style={{ color: scoreInfo.color }}>
                    {scoreAnimated}
                  </span>
                  <span className="text-gray-500 text-sm mb-1">/100</span>
                </div>
                <div className={`mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full inline-block ${scoreInfo.bg}`}>
                  {scoreInfo.label}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest leading-tight mb-2">
                  {meta.name || 'Your'}'s deficiency risk score
                </p>
                {result.urgencyMessage && (
                  <p className={`text-xs font-medium leading-snug ${isHealthy ? 'text-emerald-300' : 'text-red-300'}`}>
                    {result.urgencyMessage}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* MAIN GRID */}
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 md:gap-12 mt-6 md:mt-16 max-md:mt-6">

            {/* LEFT — SCORE + DEFICIENCIES */}
            <motion.div {...fadeUp(0.2)} className="bg-[#121821] border border-white/8 max-md:border-emerald-500/10 p-4 sm:p-5 md:p-8 lg:p-10 rounded-2xl md:rounded-3xl max-md:shadow-lg max-md:shadow-black/25">

              {/* Score — desktop only */}
              <div className="hidden md:flex items-end gap-3 mb-3">
                <span className="text-8xl lg:text-9xl font-black leading-none" style={{ color: scoreInfo.color }}>
                  {scoreAnimated}
                </span>
                <div className="mb-3">
                  <span className="text-gray-500 text-2xl">/100</span>
                  <div className={`mt-2 text-xs font-bold px-3 py-1 rounded-full inline-block ${scoreInfo.bg}`}>
                    {scoreInfo.label}
                  </div>
                </div>
              </div>

              <p className="hidden md:block text-gray-500 text-xs uppercase tracking-widest mb-6">
                {isHealthy
                  ? `${meta.name || 'Your'}'s overall deficiency risk score`
                  : `${meta.name || 'Your'}'s nutrient deficiency risk score`}
              </p>

              {result.urgencyMessage && (
                <div className={`hidden md:block mb-6 px-4 py-3 rounded-xl text-sm font-medium ${isHealthy ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
                  {result.urgencyMessage}
                </div>
              )}

              <p className="md:hidden text-[10px] font-bold tracking-widest uppercase text-emerald-400 mb-2 pt-1 border-t border-white/10">
                Nutrient gaps (read next)
              </p>

              {/* DEFICIENCY CARDS */}
              <div className="space-y-3 md:space-y-4 max-md:mt-1">
                {result.primaryDeficiencies?.length > 0 ? (
                  result.primaryDeficiencies.map((def: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                      className="bg-[#0F141A] p-3.5 sm:p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/5"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-sm md:text-base text-white leading-snug">{def.nutrient}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${getSeverityBadge(def.severity)}`}>
                          {def.severity} risk
                        </span>
                      </div>
                      <p className="text-gray-400 mt-1.5 text-xs sm:text-sm leading-relaxed">{def.reason}</p>
                      {def.symptoms?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {def.symptoms.map((s: string, j: number) => (
                            <span key={j} className="bg-white/5 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-300 text-sm">
                    ✅ No significant deficiencies detected based on your answers.
                  </div>
                )}
              </div>
            </motion.div>

            {/* RIGHT — INSIGHTS */}
            <motion.div {...fadeUp(0.25)} className="flex flex-col gap-3 md:gap-4 md:justify-center max-md:rounded-2xl max-md:border max-md:border-white/10 max-md:bg-[#0e141c] max-md:p-4">
              <p className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase max-md:mb-0.5 ${isHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                {isHealthy ? `What's Working For ${meta.name || 'You'}` : `What This Is Doing To ${meta.name || 'You'}`}
              </p>
              <p className="md:hidden text-[11px] text-gray-500 leading-snug -mt-1 mb-1">
                Short bullets — your detailed plan is below.
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
                    className="flex gap-3 bg-[#0f141c] md:bg-[#121821] p-3 sm:p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/10 md:border-white/5"
                  >
                    <Icon className={`${insightIconColor} flex-shrink-0 mt-0.5`} size={14} />
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{item}</p>
                  </motion.div>
                )
              })}
            </motion.div>

          </div>

          {/* TRANSITION */}
          <motion.div {...fadeUp(0.3)} className="text-center mt-10 md:mt-20">
            <p className="text-emerald-400 font-black tracking-widest text-[10px] sm:text-xs md:text-sm">
              {headline.transition}
            </p>
            <div className="mt-4 hidden md:flex justify-center">
              <div className="animate-bounce bg-emerald-500/10 p-3 rounded-full">
                <ArrowDown className="text-emerald-400" size={16} />
              </div>
            </div>
          </motion.div>

          {/* QUICK WINS */}
          <motion.div {...fadeUp(0.35)} className="mt-6 md:mt-16 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/25 rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8 lg:p-12 max-w-5xl mx-auto max-md:shadow-lg max-md:shadow-black/30">
            <p className="text-center text-[10px] sm:text-xs tracking-widest text-emerald-400 mb-1 font-bold uppercase">
              {isHealthy ? 'Optimize & Maintain' : 'Immediate Corrective Actions'}
            </p>
            <p className="text-center text-gray-500 text-xs sm:text-sm mb-6 md:mb-10">
              {isHealthy
                ? `Specific to ${meta.name || 'your'}'s current profile`
                : `Personalized for ${meta.name || 'your'}'s deficiency pattern`}
            </p>

            <div className="space-y-3 md:space-y-8">
              {result.quickWins?.map((win: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-start sm:items-center gap-3 sm:gap-4 md:gap-6 group max-md:rounded-xl max-md:bg-black/20 max-md:p-3 max-md:border max-md:border-white/5"
                >
                  <div className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 bg-emerald-500 text-black rounded-lg sm:rounded-xl flex items-center justify-center font-black text-xs sm:text-base md:text-lg flex-shrink-0 mt-0.5 sm:mt-0">
                    {i + 1}
                  </div>
                  <p className="text-[11px] sm:text-sm md:text-base lg:text-lg font-semibold flex-1 group-hover:text-emerald-300 transition leading-snug max-md:text-gray-200">
                    {win}
                  </p>
                  <ArrowRight className="text-emerald-400 opacity-40 group-hover:opacity-100 flex-shrink-0 hidden sm:block" size={16} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* BRIDGE */}
          <motion.div {...fadeUp(0.4)} className="text-center mt-8 md:mt-14 max-w-2xl mx-auto px-2">
            <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">
              {isHealthy ? `These habits help — ` : `These steps will help — `}
              <span className="text-white font-semibold">
                {isHealthy
                  ? `but a full personalized protocol takes ${meta.name || 'you'} from good to optimal.`
                  : `but they won't fully fix ${meta.name || 'your'}'s root deficiencies.`}
              </span>
            </p>
            <p className="mt-3 text-emerald-400 font-bold text-xs sm:text-sm">
              {isHealthy
                ? `Want a complete optimization plan built for your profile?`
                : `Want a complete recovery plan built around your exact deficiencies?`}
            </p>
            <div className="mt-4 hidden md:flex justify-center">
              <div className="animate-bounce bg-emerald-500/10 p-3 rounded-full">
                <ArrowDown className="text-emerald-400" size={16} />
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ===== SECTION 2 — PAID RECOVERY READY / GENERATING OR ₹39 OFFER ===== */}
      {flags?.recoveryReportReady ? (
        <div className="bg-white text-black px-4 md:px-6 py-10 md:py-24 rounded-t-[1.5rem] md:rounded-t-[3rem]">
          <motion.div
            {...fadeUp(0)}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle size={36} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight">
              Your personalised recovery plan is ready
            </h2>
            <p className="mt-4 text-gray-600 text-sm sm:text-base leading-relaxed">
              We emailed your PDF. Open your report page anytime to download or share.
            </p>
            <p className="mt-2 font-mono text-xs text-gray-500">{flags.recoveryReportReady.report_id}</p>
            <button
              type="button"
              onClick={() =>
                router.push(`/report/${encodeURIComponent(flags.recoveryReportReady!.report_id)}`)
              }
              className="mt-8 w-full max-w-md mx-auto block bg-gradient-to-r from-emerald-500 to-emerald-600 text-black py-4 rounded-xl font-black text-base shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Open my recovery plan
            </button>
            <button
              type="button"
              onClick={() => router.push('/detailed-assessment')}
              className="mt-6 text-sm font-semibold text-emerald-700 underline underline-offset-2"
            >
              Run detailed assessment again for an updated report
            </button>
          </motion.div>
        </div>
      ) : flags?.recoveryReportGenerating ? (
        <div className="bg-white text-black px-4 md:px-6 py-10 md:py-24 rounded-t-[1.5rem] md:rounded-t-[3rem]">
          <motion.div {...fadeUp(0)} className="max-w-2xl mx-auto text-center">
            <Loader2 className="mx-auto mb-6 h-14 w-14 animate-spin text-emerald-600" strokeWidth={2.5} />
            <h2 className="text-2xl sm:text-4xl font-black">Your recovery plan is generating</h2>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">
              This usually takes a minute or two. Keep this tab open, or check your email when it is ready.
            </p>
            <p className="mt-2 font-mono text-xs text-gray-500">{flags.recoveryReportGenerating.report_id}</p>
            <button
              type="button"
              onClick={() =>
                router.push(`/report/${encodeURIComponent(flags.recoveryReportGenerating!.report_id)}`)
              }
              className="mt-8 w-full max-w-md mx-auto block rounded-xl bg-emerald-600 py-4 font-black text-white hover:bg-emerald-700 transition"
            >
              View live status
            </button>
          </motion.div>
        </div>
      ) : (
        <div className="bg-white text-black px-4 md:px-6 py-8 md:py-24 rounded-t-[1.5rem] md:rounded-t-[3rem]">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 md:gap-16 max-md:gap-10">

            {/* LEFT */}
            <motion.div {...fadeUp(0)}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight">
                {offerHeadline.h2}
                <span className="block text-emerald-600 mt-1 md:mt-2">
                  {offerHeadline.h2sub}
                </span>
              </h2>

              <p className="mt-4 md:mt-6 text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed">
                {offerHeadline.desc}
              </p>

              <div className="grid grid-cols-3 mt-6 md:mt-12 gap-2 md:gap-10">
                <div>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black">50,000+</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-tight">Indians helped</p>
                </div>
                <div>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black">94%</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-tight">Success rate</p>
                </div>
                <div>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-emerald-600">₹39</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-tight">Recovery PDF</p>
                </div>
              </div>

              <div className="mt-6 md:mt-12 bg-gray-50 p-4 sm:p-5 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl">
                <p className="text-[10px] sm:text-xs font-bold mb-3 md:mb-6 text-gray-400 uppercase">
                  {`${meta.name || 'Your'}'s 90-Day Protocol Includes`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
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
                      <CheckCircle size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-gray-700 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* RIGHT — PRICING CARD */}
            <motion.div {...fadeUp(0.1)} className="bg-white border rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-12 shadow-xl md:shadow-2xl text-center relative overflow-hidden">

              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

              <div className="relative z-10">
                <p className="text-red-500 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-3">
                  🔥 New User Offer — Expires Soon
                </p>

                <p className="line-through text-gray-400 text-sm md:text-lg">₹299</p>
                <p className="text-5xl sm:text-6xl md:text-7xl font-black mt-1">₹39</p>
                <p className="text-emerald-600 text-xs sm:text-sm font-semibold mt-1.5">
                  {isHealthy
                    ? `Optimization plan for ${meta.name || 'you'}`
                    : `Recovery plan for ${meta.name || 'you'}'s ${result.primaryDeficiencies?.[0]?.nutrient || 'deficiencies'}`}
                </p>

                <div className="mt-4 md:mt-6 rounded-xl bg-emerald-50/80 border border-emerald-100 px-3 py-3 sm:px-4">
                  <p className="text-xs sm:text-sm text-emerald-900 font-medium leading-relaxed">
                    Next: a short follow-up questionnaire (about 2 minutes). Your personalised PDF is prepared right after you confirm — secure payment will be added here soon.
                  </p>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Trusted by <span className="font-bold text-black">50,000+ Indians</span>
                </p>

                <button
                  onClick={handleRecoveryPlanCta}
                  className="mt-5 md:mt-8 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-black py-3.5 sm:py-4 md:py-5 rounded-xl font-black text-sm sm:text-base md:text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  GET MY PERSONALISED PLAN — ₹39
                </button>

                <p className="mt-3 text-[10px] sm:text-xs text-gray-400">
                  🔐 Private • Doctor-reviewed format • PDF to your inbox
                </p>

                <div className="mt-2 flex justify-center gap-2.5 text-[10px] text-gray-400 flex-wrap">
                  <span>✔ Quick questions first</span>
                  <span>✔ Instant PDF</span>
                  <span>✔ Payment step coming soon</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => router.push('/booking')}
                    className="w-full bg-black text-white font-bold rounded-xl py-3 text-sm hover:bg-gray-900 transition"
                  >
                    📅 Book the Complete ₹3999 Plan →
                  </button>
                  <button
                    onClick={() => { localStorage.clear(); router.push('/assessment') }}
                    className="text-gray-400 text-xs mt-3 underline cursor-pointer hover:text-gray-500 transition block mx-auto"
                  >
                    Retake assessment
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      )}

    </div>
  )
}
