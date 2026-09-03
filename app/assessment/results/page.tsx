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
  CheckCircle,
  ChevronLeft,
  Home,
  Loader2,
} from 'lucide-react'
import { FullPlanBookingLink } from '@/components/payment/FullPlanBookingLink'
import { trackEvent } from '@/lib/analytics'
import { FreeHealthReport } from '@/components/assessment/FreeHealthReport'
import { LockedPremiumOffer, MobileStickyOfferBar } from '@/components/assessment/LockedPremiumOffer'

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
      const target = Math.max(0, Math.min(100, def))
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
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        {isSignedIn ? (
          <p className="text-base text-gray-500">Restoring your assessment results…</p>
        ) : null}
      </div>
    )
  }

  const deficiencyScore = typeof result.deficiencyScore === 'number' ? result.deficiencyScore : 0
  const deficiencies = Array.isArray(result.primaryDeficiencies) ? result.primaryDeficiencies : []
  const quickWins = Array.isArray(result.quickWins)
    ? result.quickWins.filter((w): w is string => typeof w === 'string')
    : []
  const displayName = typeof meta.name === 'string' ? meta.name : ''
  const goal = typeof meta.goal === 'string' ? meta.goal : ''

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
    <div className="min-h-screen bg-[#F7F8FA] text-gray-900">
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-3 py-2.5 backdrop-blur-md md:px-4 md:py-3 flex items-center gap-2 md:gap-3">
        <Link href="/assessment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition">
          <ChevronLeft size={16} />
          Retake Assessment
        </Link>
        <span className="flex-1 text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
          Health Assessment Report
        </span>
        <Link href="/" className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-800 transition" aria-label="Home">
          <Home size={18} />
        </Link>
      </div>

      <div className={`px-4 md:px-6 pt-6 md:pt-10 pb-8 md:pb-12 ${showStickyOffer ? 'max-md:pb-28' : ''}`}>
        <div className="mx-auto max-w-3xl">
          <FreeHealthReport
            name={displayName}
            score={deficiencyScore}
            scoreAnimated={scoreAnimated}
            goal={goal}
            deficiencies={deficiencies}
            quickWins={quickWins}
            meta={meta}
          />
        </div>
      </div>

      {readyReportId ? (
        <div className="px-4 md:px-6 pb-10 md:pb-16">
          <motion.div {...fadeUp(0)} className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle size={36} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight">
              Your personalised recovery plan is ready
            </h2>
            <p className="mt-4 text-gray-600 text-base sm:text-lg leading-relaxed">
              We emailed your PDF. Open your report page anytime to download or share.
            </p>
            <p className="mt-2 font-mono text-sm text-gray-500">{readyReportId}</p>
            <button
              type="button"
              onClick={() => router.push(`/report/${encodeURIComponent(readyReportId)}`)}
              className="mt-8 w-full max-w-md mx-auto block rounded-full bg-emerald-500 py-4 font-black text-lg text-black shadow-lg hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
        <div className="px-4 md:px-6 pb-10 md:pb-16">
          <motion.div {...fadeUp(0)} className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <Loader2 className="mx-auto mb-6 h-14 w-14 animate-spin text-emerald-600" strokeWidth={2.5} />
            <h2 className="text-3xl sm:text-5xl font-black">Your recovery plan is generating</h2>
            <p className="mt-4 text-gray-600 text-base sm:text-lg">
              This usually takes a minute or two. Keep this tab open, or check your email when it is ready.
            </p>
            <p className="mt-2 font-mono text-sm text-gray-500">{generatingReportId}</p>
            <button
              type="button"
              onClick={() => router.push(`/report/${encodeURIComponent(generatingReportId)}`)}
              className="mt-8 w-full max-w-md mx-auto block rounded-full bg-emerald-500 py-4 font-black text-lg text-black hover:bg-emerald-400 transition"
            >
              View live status
            </button>
          </motion.div>
        </div>
      ) : (
        <div className="px-4 md:px-6 pb-10 md:pb-20 max-md:pb-28">
          <div className="max-w-3xl mx-auto space-y-6">
            <LockedPremiumOffer
              tone="light"
              onUnlock={() => void continueToDetailedAssessment()}
              unlocking={isContinuing}
              error={continueError}
            />
            <div className="hidden md:block text-center">
              <FullPlanBookingLink className="inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900">
                Or book the complete ₹3,999 plan
              </FullPlanBookingLink>
            </div>
          </div>
        </div>
      )}

      {showStickyOffer ? (
        <MobileStickyOfferBar
          tone="light"
          onUnlock={() => void continueToDetailedAssessment()}
          unlocking={isContinuing}
        />
      ) : null}
    </div>
  )
}
