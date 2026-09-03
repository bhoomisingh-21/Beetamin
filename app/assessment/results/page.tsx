'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { getClientAssessmentFlags } from '@/lib/booking-actions'
import { signInReturnForPaidReport } from '@/lib/assessment-auth-links'
import { markAssessmentAuthReturn } from '@/lib/assessment-local-storage'
import {
  fetchRestoredAssessmentBundle,
  syncLocalAssessmentToProfile,
} from '@/lib/sync-local-assessment-client'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { FullPlanBookingLink } from '@/components/payment/FullPlanBookingLink'
import { trackEvent } from '@/lib/analytics'
import { HealthScoreRing } from '@/components/assessment/HealthScoreRing'
import { LockedPremiumOffer, MobileStickyOfferBar } from '@/components/assessment/LockedPremiumOffer'
import { lifestyleBarsFromMeta } from '@/lib/map-free-to-detailed'

const HEX_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='70' viewBox='0 0 60 70'>
  <path d='M30 0L60 17.5V52.5L30 70L0 52.5V17.5L30 0Z' fill='none' stroke='#22C55E' stroke-width='0.5' stroke-opacity='0.25'/>
</svg>`
const HEX_URL = `data:image/svg+xml,${encodeURIComponent(HEX_SVG)}`

function getHealthScoreLabel(healthScore: number) {
  if (healthScore >= 75) return { label: 'Strong profile', color: '#10b981', bg: 'bg-emerald-500/20 text-emerald-400' }
  if (healthScore >= 55) return { label: 'Room to improve', color: '#f59e0b', bg: 'bg-yellow-500/20 text-yellow-400' }
  if (healthScore >= 35) return { label: 'Needs attention', color: '#f97316', bg: 'bg-orange-500/20 text-orange-400' }
  return { label: 'Priority focus', color: '#ef4444', bg: 'bg-red-500/20 text-red-400' }
}

function getPersonalizedHeadline(
  score: number,
  name: string,
  deficiencies: { nutrient?: string }[],
) {
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

type FreeResultPayload = {
  deficiencyScore?: number
  primaryDeficiencies?: { nutrient?: string; severity?: string; reason?: string }[]
  lifestyleInsights?: unknown
  quickWins?: unknown
}

type AssessmentFlags = Awaited<ReturnType<typeof getClientAssessmentFlags>>

export default function ResultsPage() {
  const [result, setResult] = useState<FreeResultPayload | null>(null)
  const [meta, setMeta] = useState<Record<string, unknown>>({})
  const [scoreAnimated, setScoreAnimated] = useState(0)
  const [flags, setFlags] = useState<AssessmentFlags | null>(null)
  const [isContinuing, setIsContinuing] = useState(false)
  const [continueError, setContinueError] = useState<string | null>(null)
  const assessmentSyncedRef = useRef(false)
  const [resultsLoading, setResultsLoading] = useState(true)
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  /** Continue to detailed follow-up quiz; PayU runs only after that questionnaire. */
  async function continueToDetailedAssessment() {
    setContinueError(null)
    if (!isSignedIn) {
      try {
        sessionStorage.setItem('beetamin.continue39', '1')
      } catch {
        /* ignore */
      }
      router.push(signInReturnForPaidReport())
      return
    }

    const existing = flags?.paidReportForLatestDetailed
    if (existing?.status === 'ready' || existing?.status === 'generated') {
      router.push(`/report/${encodeURIComponent(existing.report_id)}`)
      return
    }
    if (existing?.status === 'generating') {
      router.push(`/report/${encodeURIComponent(existing.report_id)}`)
      return
    }
    if (!flags?.latestDetailedAssessmentId) {
      if (flags?.recoveryReportReady) {
        router.push(`/report/${encodeURIComponent(flags.recoveryReportReady.report_id)}`)
        return
      }
      if (flags?.recoveryReportGenerating) {
        router.push(`/report/${encodeURIComponent(flags.recoveryReportGenerating.report_id)}`)
        return
      }
    }

    setIsContinuing(true)
    try {
      const synced = await syncLocalAssessmentToProfile(user?.id)
      if (!synced) {
        setContinueError(
          'We could not find your free quiz on this device. Open your results right after the free assessment (same browser), or retake the free quiz below.',
        )
        return
      }
      trackEvent('quiz_started', { source: 'results_to_detailed' })
      router.push('/detailed-assessment')
    } catch (e) {
      console.error('[assessment/results] continueToDetailedAssessment', e)
      setContinueError(e instanceof Error ? e.message : 'Could not continue. Please try again.')
    } finally {
      setIsContinuing(false)
    }
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

  /** Save free quiz to Supabase as soon as the user is signed in on this page. */
  useEffect(() => {
    if (!result || !isSignedIn || !user?.id || assessmentSyncedRef.current) return
    assessmentSyncedRef.current = true
    void syncLocalAssessmentToProfile(user.id).catch(() => {
      assessmentSyncedRef.current = false
    })
  }, [result, isSignedIn, user?.id])

  useEffect(() => {
    markAssessmentAuthReturn()
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    let cancelled = false
    let scoreInterval: ReturnType<typeof setInterval> | null = null

    async function loadResults() {
      setResultsLoading(true)
      let bundle = await fetchRestoredAssessmentBundle()

      if (!bundle && isSignedIn && user?.id) {
        await syncLocalAssessmentToProfile(user.id)
        bundle = await fetchRestoredAssessmentBundle()
      }

      if (cancelled) return

      if (!bundle) {
        setResultsLoading(false)
        router.push('/assessment')
        return
      }

      const parsed = bundle.assessmentResult
      setResult(parsed)
      setMeta(bundle.assessmentMeta ?? {})

      let start = 0
      const def = typeof parsed.deficiencyScore === 'number' ? parsed.deficiencyScore : 0
      const target = Math.max(0, Math.min(100, 100 - def))
      setScoreAnimated(0)
      scoreInterval = setInterval(() => {
        start += 2
        const next = Math.min(start, target)
        setScoreAnimated(next)
        if (next >= target && scoreInterval) clearInterval(scoreInterval)
      }, 25)

      setResultsLoading(false)
    }

    void loadResults()

    return () => {
      cancelled = true
      if (scoreInterval) clearInterval(scoreInterval)
    }
  }, [isLoaded, isSignedIn, user?.id, router])

  if (resultsLoading || !result) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        {isSignedIn ? (
          <p className="text-base text-slate-400">Restoring your assessment results…</p>
        ) : null}
      </div>
    )
  }

  const deficiencyScore = typeof result.deficiencyScore === 'number' ? result.deficiencyScore : 0
  const healthScore = Math.max(0, Math.min(100, 100 - deficiencyScore))
  const scoreInfo = getHealthScoreLabel(healthScore)
  const headline = getPersonalizedHeadline(
    deficiencyScore,
    typeof meta.name === 'string' ? meta.name : '',
    result.primaryDeficiencies ?? [],
  )
  const isHealthy = deficiencyScore <= 25
  const lifestyleBars = lifestyleBarsFromMeta(meta)
  const insights = Array.isArray(result.lifestyleInsights) ? result.lifestyleInsights.slice(0, 4) : []
  const deficiencies = Array.isArray(result.primaryDeficiencies) ? result.primaryDeficiencies : []
  const firstWin = Array.isArray(result.quickWins) && result.quickWins[0] ? String(result.quickWins[0]) : null
  const snapshotLine = isHealthy
    ? 'Your profile looks solid — a few focused habits will keep it that way.'
    : 'You have a few areas that could benefit from improvement.'

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.4, delay },
  })

  const latestDetailedId = flags?.latestDetailedAssessmentId ?? null
  const paidForLatest = flags?.paidReportForLatestDetailed
  const readyReportId =
    paidForLatest && (paidForLatest.status === 'ready' || paidForLatest.status === 'generated')
      ? paidForLatest.report_id
      : !latestDetailedId && flags?.recoveryReportReady
        ? flags.recoveryReportReady.report_id
        : null
  const generatingReportId =
    paidForLatest?.status === 'generating'
      ? paidForLatest.report_id
      : !latestDetailedId && flags?.recoveryReportGenerating
        ? flags.recoveryReportGenerating.report_id
        : null

  const showStickyOffer = !readyReportId && !generatingReportId

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <div className="sticky top-0 z-10 bg-[#0B0F14]/90 backdrop-blur-md border-b border-white/5 px-3 py-2.5 md:px-4 md:py-3 flex items-center gap-2 md:gap-3">
        <Link href="/assessment" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-base transition">
          <ChevronLeft size={18} />
          Retake Assessment
        </Link>
        <span className="flex-1" />
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-base transition">← Home</Link>
      </div>

      <div
        className={`relative px-4 md:px-6 pt-8 md:pt-16 pb-8 md:pb-16 ${showStickyOffer ? 'max-md:pb-28' : ''}`}
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(16,185,129,0.08), transparent 55%), url("${HEX_URL}")`,
          backgroundSize: '100% 100%, 60px 70px',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center">
            <p className="text-xs font-bold tracking-[0.2em] text-emerald-400 uppercase">Your health snapshot</p>
            <h1 className="mt-3 text-2xl sm:text-4xl md:text-5xl font-black leading-tight">
              Your results are ready 🎉
            </h1>
            <p className="mt-2 text-gray-400 text-sm sm:text-base">
              {headline.main} {headline.sub}
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.08)} className="mt-8 rounded-3xl border border-white/8 bg-[#121821] p-6 sm:p-8 text-center">
            <HealthScoreRing score={scoreAnimated} color={scoreInfo.color} />
            <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${scoreInfo.bg}`}>
              <ShieldCheck size={12} />
              {scoreInfo.label}
            </div>
            <p className="mt-3 text-sm text-gray-400 max-w-md mx-auto leading-relaxed">{snapshotLine}</p>
          </motion.div>

          {deficiencies.length > 0 && (
            <motion.div {...fadeUp(0.12)} className="mt-6">
              <p className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-3">Potential nutrient gaps</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {deficiencies.slice(0, 4).map((def: { nutrient?: string; severity?: string; reason?: string }, i: number) => (
                  <div key={i} className="rounded-2xl border border-white/6 bg-[#121821] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-white leading-snug">{def.nutrient}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSeverityBadge(String(def.severity || 'low'))}`}>
                        {def.severity}
                      </span>
                    </div>
                    {def.reason ? (
                      <p className="mt-2 text-xs text-gray-400 leading-relaxed line-clamp-2">{def.reason}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div {...fadeUp(0.16)} className="mt-6 rounded-2xl border border-white/6 bg-[#121821] p-5">
            <p className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-4">Lifestyle score</p>
            <div className="space-y-3">
              {lifestyleBars.map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-300 font-medium">{bar.label}</span>
                    <span className="text-gray-500 tabular-nums">{bar.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${bar.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {insights.length > 0 && (
            <motion.div {...fadeUp(0.2)} className="mt-6">
              <p className="text-xs font-bold tracking-widest uppercase text-emerald-400 mb-3">Key areas to improve</p>
              <div className="grid grid-cols-1 gap-2.5">
                {insights.map((item: string, i: number) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-white/6 bg-[#121821] p-3.5">
                    {isHealthy ? (
                      <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                    ) : (
                      <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
                    )}
                    <p className="text-sm text-gray-300 leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {firstWin && (
            <motion.div {...fadeUp(0.24)} className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
              <p className="text-xs font-bold tracking-widest uppercase text-emerald-400">One thing to start with</p>
              <p className="mt-2 text-sm font-semibold text-white leading-snug">{firstWin}</p>
            </motion.div>
          )}
        </div>
      </div>

      {readyReportId ? (
        <div className="bg-white text-black px-4 md:px-6 py-10 md:py-24 rounded-t-[1.5rem] md:rounded-t-[3rem]">
          <motion.div {...fadeUp(0)} className="max-w-2xl mx-auto text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle size={36} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight">
              Your personalised recovery plan is ready
            </h2>
            <p className="mt-4 text-gray-600 text-base sm:text-lg leading-relaxed">
              We emailed your PDF. Open your report page anytime to download or share.
            </p>
            <p className="mt-2 font-mono text-sm text-gray-500">{readyReportId}</p>
            <button
              type="button"
              onClick={() => router.push(`/report/${encodeURIComponent(readyReportId)}`)}
              className="mt-8 w-full max-w-md mx-auto block rounded-xl bg-emerald-600 py-4 font-black text-lg text-white shadow-lg hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Open My PDF Report
            </button>
            <button
              type="button"
              onClick={() => router.push('/detailed-assessment')}
              className="mt-6 text-base font-semibold text-emerald-700 underline underline-offset-2"
            >
              Run detailed assessment again for an updated report
            </button>
          </motion.div>
        </div>
      ) : generatingReportId ? (
        <div className="bg-white text-black px-4 md:px-6 py-10 md:py-24 rounded-t-[1.5rem] md:rounded-t-[3rem]">
          <motion.div {...fadeUp(0)} className="max-w-2xl mx-auto text-center">
            <Loader2 className="mx-auto mb-6 h-14 w-14 animate-spin text-emerald-600" strokeWidth={2.5} />
            <h2 className="text-3xl sm:text-5xl font-black">Your recovery plan is generating</h2>
            <p className="mt-4 text-gray-600 text-base sm:text-lg">
              This usually takes a minute or two. Keep this tab open, or check your email when it is ready.
            </p>
            <p className="mt-2 font-mono text-sm text-gray-500">{generatingReportId}</p>
            <button
              type="button"
              onClick={() => router.push(`/report/${encodeURIComponent(generatingReportId)}`)}
              className="mt-8 w-full max-w-md mx-auto block rounded-xl bg-emerald-600 py-4 font-black text-lg text-white hover:bg-emerald-700 transition"
            >
              View live status
            </button>
          </motion.div>
        </div>
      ) : (
        <div className="px-4 md:px-6 pb-10 md:pb-20 max-md:pb-28">
          <div className="max-w-3xl mx-auto space-y-6">
            <LockedPremiumOffer
              onUnlock={() => void continueToDetailedAssessment()}
              unlocking={isContinuing}
              error={continueError}
            />
            <div className="hidden md:block text-center">
              <FullPlanBookingLink className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white">
                Or book the complete ₹3,999 plan
              </FullPlanBookingLink>
            </div>
          </div>
        </div>
      )}

      {showStickyOffer ? (
        <MobileStickyOfferBar
          onUnlock={() => void continueToDetailedAssessment()}
          unlocking={isContinuing}
        />
      ) : null}
    </div>
  )
}
