'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ReportAppHeader } from '@/components/report/ReportAppHeader'
import Footer from '@/components/sections/Footer'
import { ReportReadyLayout } from './ReportReadyLayout'

type PollStatus = 'generating' | 'ready' | 'failed' | 'generated' | string | null

type PaidReportRow = {
  status: PollStatus
  pdf_url: string | null
  email: string | null
  report_id: string | null
  assessment_id: string | null
}

const GENERATING_MESSAGES = [
  'Analyzing your deficiencies and symptoms…',
  'Building your personalized 7-day meal plan…',
  'Selecting evidence-based supplement guidance…',
  'Formatting your recovery plan as a professional PDF…',
  'Almost there — final checks before delivery…',
]

const POLL_MS = 4000
const TIMEOUT_MS = 180000

function isReadyStatus(s: PollStatus): boolean {
  return s === 'ready' || s === 'generated'
}

function ReportLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f7f4]">
      <ReportAppHeader />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-12 lg:items-start lg:py-16">
        <div className="animate-pulse rounded-3xl bg-gradient-to-br from-[#143622] to-[#2d6a4f] p-10 lg:col-span-5 lg:min-h-[320px]" />
        <div className="space-y-6 lg:col-span-7">
          <div className="animate-pulse rounded-3xl border border-stone-200/80 bg-white p-8 shadow-lg">
            <div className="h-3 w-32 rounded bg-stone-200" />
            <div className="mt-4 h-7 w-48 rounded bg-stone-200" />
            <div className="mt-6 h-14 w-full rounded-2xl bg-[#1a472a]/20" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
              >
                <div className="h-10 w-10 rounded-full bg-emerald-100/80" />
                <div className="mt-3 h-3 w-full rounded bg-stone-200" />
                <div className="mt-2 h-2 w-3/4 rounded bg-stone-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function ReportErrorState({ title, body, reportId }: { title: string; body: string; reportId: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7f4]">
      <ReportAppHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-stone-200/90 bg-white p-8 text-center shadow-xl shadow-stone-200/40 md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
            <AlertCircle className="h-9 w-9 text-amber-600" strokeWidth={2} />
          </div>
          <h1 className="mt-6 text-xl font-bold tracking-tight text-stone-900 md:text-2xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            {body}{' '}
            {reportId ? <span className="font-mono text-xs text-stone-800">({reportId})</span> : null}
          </p>
          <Link
            href="/profile"
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#1a472a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1a472a]/25 transition hover:bg-[#143622]"
          >
            Go back to My Profile
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: `${(i * 37) % 100}%`,
    delay: `${(i % 8) * 0.08}s`,
    hue: (i * 47) % 360,
  }))
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece absolute top-[-12px] h-3 w-2 rounded-sm opacity-90"
          style={{
            left: p.left,
            animationDelay: p.delay,
            backgroundColor: `hsl(${p.hue} 75% 52%)`,
          }}
        />
      ))}
    </div>
  )
}

function ReportExistingNoticeBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get('notice') !== 'already-have-report') return null
  return (
    <div className="border-b border-emerald-200/80 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-950">
      You already have a report for this assessment — here it is.
    </div>
  )
}

function ReportPageInner() {
  const params = useParams()
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  const reportIdRaw = params?.reportId
  const reportId = typeof reportIdRaw === 'string' ? decodeURIComponent(reportIdRaw.trim()) : ''

  const [view, setView] = useState<
    'loading' | 'generating' | 'ready' | 'failed' | 'timeout' | 'not_found' | 'error'
  >('loading')
  const [pollData, setPollData] = useState<PaidReportRow | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const downloadBusyRef = useRef(false)
  const [retryBusy, setRetryBusy] = useState(false)
  const [retryMessage, setRetryMessage] = useState<string | null>(null)

  const pollPaidReport = useCallback(async (): Promise<{ data: PaidReportRow | null; error: boolean }> => {
    if (!reportId) return { data: null, error: true }
    const res = await fetch(`/api/report-status?reportId=${encodeURIComponent(reportId)}`, {
      credentials: 'include',
    })
    if (res.status === 401) {
      router.replace(`/sign-in?after=${encodeURIComponent(`/report/${reportId}`)}`)
      return { data: null, error: true }
    }
    const json = (await res.json()) as PaidReportRow & { error?: string }
    if (!res.ok) {
      console.error('[report page] report-status', res.status, json)
      return { data: null, error: true }
    }
    if (json.error) {
      return { data: null, error: true }
    }
    const data: PaidReportRow = {
      status: json.status,
      pdf_url: json.pdf_url ?? null,
      email: json.email ?? null,
      report_id: json.report_id ?? null,
      assessment_id:
        json.assessment_id != null && json.assessment_id !== '' ? String(json.assessment_id) : null,
    }
    return { data, error: false }
  }, [reportId, router])

  const handleRetryGeneration = useCallback(async () => {
    const aid = pollData?.assessment_id
    if (!aid || retryBusy) return
    setRetryMessage(null)
    setRetryBusy(true)
    try {
      let freeAssessmentResult: unknown = null
      try {
        const raw = localStorage.getItem('assessmentResult')
        if (raw) freeAssessmentResult = JSON.parse(raw) as unknown
      } catch {
        /* ignore bad JSON */
      }
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailedAssessmentId: aid, freeAssessmentResult }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string; reportId?: string }
      if (!res.ok) {
        setRetryMessage(typeof json.error === 'string' ? json.error : 'Could not restart generation.')
        return
      }
      if (json.reportId) {
        setView('generating')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } finally {
      setRetryBusy(false)
    }
  }, [pollData?.assessment_id, retryBusy])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.replace(`/sign-in?after=${encodeURIComponent(`/report/${reportId || ''}`)}`)
      return
    }
    if (!reportId) {
      setView('not_found')
    }
  }, [isLoaded, isSignedIn, reportId, router])

  useEffect(() => {
    if (view !== 'loading' || !reportId || !isSignedIn) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await pollPaidReport()
      if (cancelled) return
      if (error) {
        setView('error')
        return
      }
      if (!data) {
        setView('not_found')
        return
      }
      if (data.status == null) {
        setView('not_found')
        return
      }
      setPollData(data)
      if (isReadyStatus(data.status)) {
        setView('ready')
        setShowConfetti(true)
        if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
        confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 3200)
        return
      }
      if (data.status === 'failed') {
        setView('failed')
        return
      }
      if (data.status === 'generating') {
        setView('generating')
        return
      }
      setView('generating')
    })()
    return () => {
      cancelled = true
    }
  }, [view, reportId, isSignedIn, pollPaidReport])

  useEffect(() => {
    if (view !== 'generating' || !reportId) return

    const interval = setInterval(async () => {
      const { data, error } = await pollPaidReport()
      if (error || !data) return
      setPollData(data)
      if (isReadyStatus(data.status)) {
        setView('ready')
        setShowConfetti(true)
        if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
        confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 3200)
      } else if (data.status === 'failed') {
        setView('failed')
      }
    }, POLL_MS)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      setView((v) => (v === 'generating' ? 'timeout' : v))
    }, TIMEOUT_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [view, reportId, pollPaidReport])

  useEffect(() => {
    if (view !== 'generating') return
    const t = setInterval(() => {
      setMessageIndex((i) => (i + 1) % GENERATING_MESSAGES.length)
    }, 3200)
    return () => clearInterval(t)
  }, [view])

  useEffect(() => {
    return () => {
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
    }
  }, [])

  const preparedDate = useMemo(() => {
    const id = pollData?.report_id || reportId
    const idDateMatch = id?.match(/^BT-(\d{4})(\d{2})(\d{2})-/)
    let preparedSource = idDateMatch
      ? new Date(`${idDateMatch[1]}-${idDateMatch[2]}-${idDateMatch[3]}T12:00:00Z`)
      : new Date()
    if (Number.isNaN(preparedSource.getTime())) preparedSource = new Date()
    return preparedSource.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [pollData?.report_id, reportId])

  const displayReportId = pollData?.report_id || reportId
  const patientName = user?.firstName?.trim() ?? ''
  const displayName = patientName ? `${patientName}'s` : 'Your'
  const email = pollData?.email || user?.primaryEmailAddress?.emailAddress || ''

  const handleDownloadPdf = useCallback(async () => {
    if (!displayReportId || downloadBusyRef.current) return
    downloadBusyRef.current = true
    setDownloadStatus('loading')
    try {
      const res = await fetch(
        `/api/download-report?reportId=${encodeURIComponent(displayReportId)}&disposition=attachment`,
        { credentials: 'include' },
      )
      if (res.status === 401) {
        router.replace(`/sign-in?after=${encodeURIComponent(`/report/${displayReportId}`)}`)
        setDownloadStatus('idle')
        return
      }
      if (!res.ok) {
        setDownloadStatus('error')
        return
      }
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition')
      let filename = `Beetamin-Recovery-${displayReportId.replace(/[^a-zA-Z0-9-_.]/g, '_')}.pdf`
      const m = cd?.match(/filename="([^"]+)"/i) ?? cd?.match(/filename\*=UTF-8''([^;]+)/i)
      if (m?.[1]) {
        try {
          filename = decodeURIComponent(m[1])
        } catch {
          filename = m[1]
        }
      }
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
      setDownloadStatus('success')
    } catch {
      setDownloadStatus('error')
    } finally {
      downloadBusyRef.current = false
    }
  }, [displayReportId, router])

  useEffect(() => {
    setDownloadStatus('idle')
  }, [displayReportId])

  if (!isLoaded) {
    return <ReportLoadingSkeleton />
  }

  if (!isSignedIn) {
    return <ReportLoadingSkeleton />
  }

  if (!reportId) {
    return (
      <ReportErrorState
        title="We couldn't find your report"
        body="Please contact us at support@thebeetamin.com with your Report ID."
        reportId=""
      />
    )
  }

  if (view === 'error') {
    return (
      <ReportErrorState
        title="We couldn't load your report status"
        body="Please refresh the page. If it keeps failing, contact support@thebeetamin.com."
        reportId={displayReportId}
      />
    )
  }

  if (view === 'not_found') {
    return (
      <ReportErrorState
        title="We couldn't find your report"
        body="Please contact us at support@thebeetamin.com with your Report ID."
        reportId={displayReportId}
      />
    )
  }

  if (view === 'failed') {
    const canRetry = Boolean(pollData?.assessment_id)
    return (
      <div className="flex min-h-screen flex-col bg-[#f6f7f4]">
        <ReportAppHeader />
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg rounded-3xl border border-stone-200/90 bg-white p-8 text-center shadow-xl shadow-stone-200/40 md:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
              <AlertCircle className="h-9 w-9 text-red-600" strokeWidth={2} />
            </div>
            <h1 className="mt-6 text-xl font-bold tracking-tight text-stone-900 md:text-2xl">Report generation failed</h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Something went wrong generating your report. You can try again — we&apos;ll use your saved assessment
              answers when this browser still has them.
            </p>
            <p className="mt-2 font-mono text-xs text-stone-500">
              Report ID: <span className="text-stone-800">{displayReportId}</span>
            </p>
            {retryMessage ? (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">{retryMessage}</p>
            ) : null}
            {canRetry ? (
              <button
                type="button"
                disabled={retryBusy}
                onClick={() => void handleRetryGeneration()}
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[#1a472a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1a472a]/25 transition hover:bg-[#143622] disabled:opacity-60"
              >
                {retryBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting…
                  </span>
                ) : (
                  'Regenerate PDF'
                )}
              </button>
            ) : (
              <p className="mt-4 text-xs text-stone-500">
                We couldn&apos;t link this report to your questionnaire. Open the detailed assessment from your profile
                and tap generate again, or contact{' '}
                <a href="mailto:support@thebeetamin.com" className="font-semibold text-[#1a472a] underline">
                  support@thebeetamin.com
                </a>
                .
              </p>
            )}
            <Link
              href="/profile"
              className={`mt-4 inline-flex w-full items-center justify-center rounded-2xl border-2 border-[#1a472a]/25 bg-white px-6 py-3.5 text-sm font-semibold text-[#1a472a] transition hover:bg-stone-50 ${canRetry ? '' : 'mt-6'}`}
            >
              Go back to My Profile
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (view === 'timeout') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-stone-200/90 bg-white p-8 text-center shadow-xl shadow-stone-200/40 md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
            <Loader2 className="h-9 w-9 animate-spin text-[#1a472a]" strokeWidth={2} />
          </div>
          <h1 className="mt-6 text-xl font-bold tracking-tight text-stone-900 md:text-2xl">Still working on it</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Your report is taking longer than usual. We&apos;ll email it to you when it&apos;s ready. You can close this
            page safely.
          </p>
          <p className="mt-4 font-mono text-xs text-stone-500">Report ID: {displayReportId}</p>
          <Link
            href="/profile"
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl border-2 border-[#1a472a]/20 bg-white px-6 py-3.5 text-sm font-semibold text-[#1a472a] transition hover:border-[#1a472a]/40 hover:bg-[#f0fdf4]"
          >
            Go to My Profile
          </Link>
        </div>
      </div>
    )
  }

  if (view === 'loading' || view === 'generating') {
    const showLoader = view === 'generating'
    return (
      <div className="min-h-screen bg-[#f6f7f4]">
        <ReportAppHeader />
        <section className="relative overflow-hidden bg-[#1a2e1a] px-4 py-12 text-white sm:px-6 sm:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
                {showLoader ? 'Preparing your recovery plan' : 'Loading your report'}
              </h1>
              {showLoader ? (
                <p className="mt-4 min-h-[3rem] text-sm text-white/90 sm:text-base">
                  {GENERATING_MESSAGES[messageIndex]}
                </p>
              ) : (
                <p className="mt-4 text-sm text-white/85">Fetching your report status…</p>
              )}
              <p className="mt-4 font-mono text-xs text-white/70">Report ID: {displayReportId}</p>
            </motion.div>
            <div className="flex justify-center lg:justify-end">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20">
                <Loader2 className="h-14 w-14 animate-spin text-white" strokeWidth={2} />
              </div>
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-stone-600">
          {showLoader
            ? 'This usually takes one to two minutes. This page updates automatically when your PDF is ready — you can keep this tab open or check your email.'
            : 'Please wait…'}
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <>
      <ConfettiBurst active={showConfetti} />
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0.85; } } .confetti-piece { animation: confettiFall 2.8s ease-in forwards; }`,
        }}
      />
      <Suspense fallback={null}>
        <ReportExistingNoticeBanner />
      </Suspense>
      <ReportReadyLayout
        displayReportId={displayReportId}
        preparedDate={preparedDate}
        displayName={displayName}
        email={email}
        downloadStatus={downloadStatus}
        onDownload={handleDownloadPdf}
      />
    </>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={<ReportLoadingSkeleton />}>
      <ReportPageInner />
    </Suspense>
  )
}
