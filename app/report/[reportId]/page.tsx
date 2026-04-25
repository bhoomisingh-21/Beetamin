'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Ban,
  CalendarDays,
  Check,
  Download,
  FileText,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  Microscope,
  Pill,
  Stethoscope,
  User,
  UtensilsCrossed,
} from 'lucide-react'

type PollStatus = 'generating' | 'ready' | 'failed' | 'generated' | string | null

type PaidReportRow = {
  status: PollStatus
  pdf_url: string | null
  email: string | null
  report_id: string | null
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

const REPORT_INSIDE_ITEMS = [
  {
    Icon: Microscope,
    title: 'Deficiency Analysis',
    desc: 'Your top deficiencies identified with severity levels',
  },
  {
    Icon: UtensilsCrossed,
    title: '7-Day Meal Plan',
    desc: 'Daily Indian meals targeting your exact deficiencies',
  },
  {
    Icon: Pill,
    title: 'Supplement Guide',
    desc: '1-2 safe supplements with exact dosage and brands',
  },
  {
    Icon: Ban,
    title: 'Foods to Avoid',
    desc: 'Specific foods blocking your recovery and why',
  },
  {
    Icon: CalendarDays,
    title: 'Daily Routine',
    desc: 'A realistic recovery schedule built for your lifestyle',
  },
  {
    Icon: Stethoscope,
    title: "Doctor's Note",
    desc: 'Personal note from Dr. Priya Sharma, Nutritionist',
  },
] as const

function isReadyStatus(s: PollStatus): boolean {
  return s === 'ready' || s === 'generated'
}

function ReportLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f7f4]">
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
    </div>
  )
}

function ReportErrorState({ title, body, reportId }: { title: string; body: string; reportId: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-4 py-16">
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
          href="/booking/dashboard"
          className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#1a472a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1a472a]/25 transition hover:bg-[#143622]"
        >
          Go back to Dashboard
        </Link>
      </div>
    </div>
  )
}

function ReportDownloadPrimaryButton({
  status,
  onPress,
  variant,
}: {
  status: 'idle' | 'loading' | 'success' | 'error'
  onPress: () => void
  variant: 'mobile' | 'desktop'
}) {
  const busy = status === 'loading'
  const done = status === 'success'
  const failed = status === 'error'
  const mobileCls =
    'mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-bold transition md:text-base disabled:cursor-not-allowed disabled:opacity-90'
  const desktopCls =
    'mt-8 flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-4 text-sm font-bold shadow-lg transition md:text-base disabled:cursor-not-allowed disabled:opacity-95'
  const palette = done
    ? 'bg-emerald-700 text-white shadow-emerald-900/25 hover:bg-emerald-700'
    : failed
      ? 'bg-red-600 text-white shadow-red-900/20 hover:bg-red-700'
      : variant === 'desktop'
        ? 'bg-gradient-to-r from-[#1a472a] to-[#143622] text-white shadow-[#1a472a]/30 hover:brightness-110 active:scale-[0.99]'
        : 'bg-[#1a472a] text-white hover:bg-[#143622] hover:scale-[1.01]'
  return (
    <button
      type="button"
      onClick={() => {
        if (!busy && !done) void onPress()
      }}
      disabled={busy || done}
      className={`${variant === 'mobile' ? mobileCls : desktopCls} ${palette}`}
    >
      {busy ? (
        <>
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" strokeWidth={2.5} />
          Preparing download…
        </>
      ) : done ? (
        <>
          <Check className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          Downloaded successfully
        </>
      ) : failed ? (
        <>
          <Download className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          Try download again
        </>
      ) : (
        <>
          <Download className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          Download My Recovery Plan (PDF)
        </>
      )}
    </button>
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

export default function ReportPage() {
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
    }
    return { data, error: false }
  }, [reportId, router])

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-stone-200/90 bg-white p-8 text-center shadow-xl shadow-stone-200/40 md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
            <AlertCircle className="h-9 w-9 text-red-600" strokeWidth={2} />
          </div>
          <h1 className="mt-6 text-xl font-bold tracking-tight text-stone-900 md:text-2xl">Report generation failed</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Something went wrong generating your report. Please contact{' '}
            <a href="mailto:support@thebeetamin.com" className="font-semibold text-[#1a472a] underline decoration-[#1a472a]/30 underline-offset-2">
              support@thebeetamin.com
            </a>{' '}
            with your Report ID:{' '}
            <span className="font-mono text-xs text-stone-800">{displayReportId}</span>
          </p>
          <Link
            href="/booking/dashboard"
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#1a472a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1a472a]/25 transition hover:bg-[#143622]"
          >
            Go back to Dashboard
          </Link>
        </div>
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
            href="/booking/dashboard"
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl border-2 border-[#1a472a]/20 bg-white px-6 py-3.5 text-sm font-semibold text-[#1a472a] transition hover:border-[#1a472a]/40 hover:bg-[#f0fdf4]"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (view === 'loading' || view === 'generating') {
    return (
      <>
        {/* Mobile: classic full-width hero + status copy (matches pre–split layout) */}
        <div className="min-h-screen bg-[#fafafa] pb-12 lg:hidden">
          <section className="bg-gradient-to-b from-[#1a472a] to-[#2d6a4f] px-4 py-10 md:px-6 md:py-[60px]">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                <Loader2 className="h-10 w-10 animate-spin text-[#1a472a]" strokeWidth={2.5} />
              </div>
              <h1 className="mt-5 text-[24px] font-extrabold leading-tight text-white md:text-3xl">
                Preparing your recovery plan
              </h1>
              <p className="mt-4 min-h-[3rem] max-w-md text-sm text-white/90 md:text-base">
                {GENERATING_MESSAGES[messageIndex]}
              </p>
              <span className="mt-4 inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Report ID: {displayReportId}
              </span>
            </div>
          </section>
          <div className="mx-auto max-w-lg px-4 pt-8 text-center text-sm text-gray-600">
            This usually takes one to two minutes. This page will update automatically when your PDF is ready.
          </div>
        </div>

        {/* Desktop: nav + split hero / status */}
        <div className="hidden min-h-screen bg-[#f6f7f4] pb-16 lg:block">
          <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#f6f7f4]/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white/80"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                Back
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/booking/profile"
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-[#1a472a]/30 hover:text-[#1a472a]"
                >
                  <User className="h-4 w-4" strokeWidth={2} />
                  Profile
                </Link>
                <Link
                  href="/booking/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1a472a] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#143622]"
                >
                  <LayoutDashboard className="h-4 w-4" strokeWidth={2} />
                  Dashboard
                </Link>
              </div>
            </div>
          </header>
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(26,71,42,0.12),transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pt-6 md:pt-10 lg:pt-12">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-10">
              <aside className="lg:col-span-5">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f2918] via-[#1a472a] to-[#2f5d45] p-8 text-center shadow-2xl shadow-[#1a472a]/20 ring-1 ring-white/10 md:p-10 lg:sticky lg:top-24 lg:text-left">
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl"
                    aria-hidden
                  />
                  <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/95 shadow-lg ring-1 ring-white/50 lg:mx-0">
                    <Loader2 className="h-10 w-10 animate-spin text-[#1a472a]" strokeWidth={2.5} />
                  </div>
                  <h1 className="relative mt-6 text-2xl font-extrabold leading-tight tracking-tight text-white md:text-3xl lg:mt-8">
                    Preparing your recovery plan
                  </h1>
                  <p className="relative mt-2 text-sm font-medium text-emerald-100/90">Dr. Priya Sharma · Clinical Nutritionist</p>
                  <p className="relative mx-auto mt-6 min-h-[3.25rem] max-w-sm text-sm leading-relaxed text-white/90 md:text-base lg:mx-0">
                    {GENERATING_MESSAGES[messageIndex]}
                  </p>
                  <div className="relative mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-mono text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
                    <span className="text-emerald-200/80">ID</span>
                    {displayReportId}
                  </div>
                </div>
              </aside>
              <div className="lg:col-span-7">
                <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-200/30 md:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a472a]/80">Status</p>
                  <p className="mt-2 text-lg font-bold text-stone-900">Almost there</p>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">
                    This usually takes one to two minutes. This page updates automatically when your PDF is ready — you
                    can keep this tab open or check your email.
                  </p>
                  <ul className="mt-6 space-y-3 border-t border-stone-100 pt-6 text-sm text-stone-600">
                    <li className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      AI builds your personalised deficiency analysis and meal plan
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      Your PDF is secured and emailed when complete
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <ConfettiBurst active={showConfetti} />
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes reportCheckPop { 0% { transform: scale(0.82); opacity: 0.65; } 100% { transform: scale(1); opacity: 1; } } .report-check-pop { animation: reportCheckPop 0.55s ease-out forwards; } @keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0.85; } } .confetti-piece { animation: confettiFall 2.8s ease-in forwards; }`,
        }}
      />
      {/* Mobile: original stacked layout */}
      <div className="min-h-screen bg-[#fafafa] pb-12 lg:hidden">
        <section className="bg-gradient-to-b from-[#1a472a] to-[#2d6a4f] px-4 py-10 md:px-6 md:py-[60px]">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div
              className="report-check-pop flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg"
              aria-hidden
            >
              <Check className="h-10 w-10 text-[#1a472a]" strokeWidth={3} />
            </div>
            <h1 className="mt-5 text-[28px] font-extrabold leading-tight text-white md:text-4xl md:leading-tight">
              Your Recovery Plan is Ready!
            </h1>
            <p className="mt-3 max-w-md text-sm text-white/85 md:text-base">
              Prepared by Dr. Priya Sharma, Clinical Nutritionist
            </p>
            <span className="mt-2 inline-flex items-center rounded-full border border-white/30 bg-white px-3 py-1 text-xs font-semibold text-[#1a472a]">
              Report ID: {displayReportId}
            </span>
          </div>
        </section>

        <div className="mx-auto max-w-[480px] px-4 md:px-0">
          <div className="-mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] md:-mt-[30px] md:p-8">
            <p className="mb-4 text-[9px] font-semibold uppercase tracking-[1.5px] text-[#666] md:text-[11px]">
              Your report is ready to download
            </p>
            <h2 className="text-base font-bold text-[#1a1a1a] md:text-lg">{displayName} Recovery Plan</h2>
            <p className="mt-1 text-[11px] text-[#888] md:text-[13px]">Prepared on {preparedDate}</p>

            <ReportDownloadPrimaryButton
              status={downloadStatus}
              onPress={handleDownloadPdf}
              variant="mobile"
            />

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-3 md:px-4">
              <Mail className="h-5 w-5 shrink-0 text-[#166534]" strokeWidth={2} />
              <p className="text-left text-[11px] leading-snug text-[#166534] md:text-[13px]">
                A copy has been sent to {email ? <span className="font-medium">{email}</span> : 'your email on file'}
              </p>
            </div>
          </div>

          <section className="mx-auto mt-8 max-w-[480px] md:mt-8">
            <p className="mb-4 text-center text-[9px] font-semibold uppercase tracking-[1.5px] text-[#888] md:text-[11px]">
              What&apos;s inside your report
            </p>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_INSIDE_ITEMS.map(({ Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-[#e8f5e9] bg-white p-3 md:p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4edda] md:h-10 md:w-10">
                    <Icon className="h-5 w-5 text-[#1a472a]" strokeWidth={2} />
                  </div>
                  <p className="mt-3 text-[11px] font-bold text-[#1a1a1a] md:text-[13px]">{title}</p>
                  <p className="mt-1 text-[10px] leading-snug text-[#666] md:text-xs">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 w-full bg-[#ececec] px-4 py-6 md:mt-8 md:py-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-3 md:flex-row md:items-center md:justify-center md:gap-10">
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#444] md:text-[13px]">
              <Lock className="h-4 w-4 shrink-0 text-[#1a472a]" />
              100% Private &amp; Confidential
            </div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#444] md:text-[13px]">
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#1a472a]" />
              Doctor Reviewed Format
            </div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#444] md:text-[13px]">
              <FileText className="h-4 w-4 shrink-0 text-[#1a472a]" />
              Professional PDF Report
            </div>
          </div>
        </section>

        <div className="mx-auto mb-12 mt-8 flex max-w-lg flex-col items-center px-4 text-center md:mt-8">
          <p className="text-xs text-[#666] md:text-sm">Want to track your recovery progress?</p>
          <Link
            href="/booking/dashboard"
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-[#1a472a] px-6 py-3 text-xs font-semibold text-[#1a472a] transition hover:bg-[#f0fdf4] md:text-sm"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Go to My Dashboard
          </Link>
        </div>
      </div>

      {/* Desktop: nav + hero + main + right rail (trust & dashboard) */}
      <div className="hidden min-h-screen bg-[#f6f7f4] pb-16 lg:block">
        <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#f6f7f4]/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white/80"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Back
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/booking/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-[#1a472a]/30 hover:text-[#1a472a]"
              >
                <User className="h-4 w-4" strokeWidth={2} />
                Profile
              </Link>
              <Link
                href="/booking/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1a472a] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#143622]"
              >
                <LayoutDashboard className="h-4 w-4" strokeWidth={2} />
                Dashboard
              </Link>
            </div>
          </div>
        </header>
        <div
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(26,71,42,0.14),transparent),radial-gradient(ellipse_50%_40%_at_100%_50%,rgba(45,106,79,0.08),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-4 pt-6 md:pt-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
            <aside className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f2918] via-[#1a472a] to-[#2f5d45] p-8 text-center shadow-2xl shadow-[#1a472a]/25 ring-1 ring-white/10 md:p-10 lg:sticky lg:top-24 lg:text-left">
                <div
                  className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
                  aria-hidden
                />
                <div
                  className="report-check-pop relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-white/60 lg:mx-0"
                  aria-hidden
                >
                  <Check className="h-10 w-10 text-[#1a472a]" strokeWidth={3} />
                </div>
                <p className="relative mt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-200/90">
                  Personalised report
                </p>
                <h1 className="relative mt-2 text-2xl font-extrabold leading-[1.15] tracking-tight text-white md:text-4xl md:leading-tight">
                  Your Recovery Plan is Ready!
                </h1>
                <p className="relative mt-4 max-w-sm text-sm leading-relaxed text-white/85 md:text-base lg:max-w-none">
                  Prepared by <span className="font-semibold text-white">Dr. Priya Sharma</span>, Clinical Nutritionist
                </p>
                <div className="relative mt-8 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 font-mono text-[11px] font-semibold tracking-wide text-white backdrop-blur-md md:text-xs">
                  <span className="text-emerald-200/90">Report ID</span>
                  {displayReportId}
                </div>
              </div>
            </aside>

            <div className="space-y-8 lg:col-span-4">
              <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xl shadow-stone-300/20 ring-1 ring-stone-100/80 md:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a472a]/80">Download</p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-stone-900 md:text-2xl">
                  {displayName} Recovery Plan
                </h2>
                <p className="mt-1 text-sm text-stone-500">Prepared on {preparedDate}</p>
                <p className="mt-4 text-xs leading-relaxed text-stone-600 md:text-sm">
                  Your clinician-formatted PDF is secured in your account. Download anytime — a copy was also sent to
                  your inbox.
                </p>

                <ReportDownloadPrimaryButton
                  status={downloadStatus}
                  onPress={handleDownloadPdf}
                  variant="desktop"
                />

                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-[#f0fdf4] to-emerald-50/50 p-4 md:p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-emerald-100">
                    <Mail className="h-5 w-5 text-[#166534]" strokeWidth={2} />
                  </div>
                  <p className="text-left text-sm leading-snug text-[#14532d]">
                    <span className="font-semibold text-[#166534]">Emailed copy</span>
                    <span className="text-emerald-900/80">
                      {' '}
                      — sent to {email ? <span className="font-medium">{email}</span> : 'your email on file'}
                    </span>
                  </p>
                </div>
              </div>

              <section>
                <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Inside your report</h3>
                  <p className="text-xs text-stone-400">Six clinical sections</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {REPORT_INSIDE_ITEMS.map(({ Icon, title, desc }) => (
                    <div
                      key={title}
                      className="group rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200/80 hover:shadow-md md:p-5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-[#ecfdf5] ring-1 ring-emerald-100/80 transition group-hover:ring-emerald-200">
                        <Icon className="h-5 w-5 text-[#1a472a]" strokeWidth={2} />
                      </div>
                      <p className="mt-3 text-sm font-bold text-stone-900">{title}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="lg:col-span-3">
              <div className="flex flex-col gap-6 rounded-2xl border border-stone-200/90 bg-white p-6 shadow-lg shadow-stone-200/30 ring-1 ring-stone-100/80 lg:sticky lg:top-24">
                <div className="flex flex-col gap-4 border-b border-stone-100 pb-6">
                  <div className="flex items-start gap-2 text-xs font-medium text-stone-700 md:text-sm">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#1a472a]" strokeWidth={2} />
                    <span>100% Private &amp; Confidential</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs font-medium text-stone-700 md:text-sm">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1a472a]" strokeWidth={2} />
                    <span>Doctor Reviewed Format</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs font-medium text-stone-700 md:text-sm">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#1a472a]" strokeWidth={2} />
                    <span>Professional PDF Report</span>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <p className="text-sm font-semibold text-stone-800">Track your recovery</p>
                  <p className="mt-1 text-xs text-stone-500">Sessions, goals, and follow-ups in one place.</p>
                  <Link
                    href="/booking/dashboard"
                    className="mx-auto mt-5 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#1a472a]/20 bg-[#1a472a] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#143622]"
                  >
                    <LayoutDashboard className="h-4 w-4" strokeWidth={2} />
                    Go to My Dashboard
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
