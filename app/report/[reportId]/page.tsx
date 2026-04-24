'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
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

function isReadyStatus(s: PollStatus): boolean {
  return s === 'ready' || s === 'generated'
}

function ReportLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div className="animate-pulse bg-gradient-to-b from-[#1a472a] to-[#2d6a4f] px-4 py-10 md:py-[60px]">
        <div className="mx-auto flex max-w-lg flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-white/20" />
          <div className="mt-5 h-8 w-64 rounded-lg bg-white/20" />
          <div className="mt-3 h-4 w-48 rounded bg-white/15" />
        </div>
      </div>
      <div className="mx-auto -mt-8 max-w-lg px-4">
        <div className="animate-pulse rounded-2xl border border-white/60 bg-white p-6 shadow-lg md:p-8">
          <div className="h-3 w-40 rounded bg-[#d4edda]" />
          <div className="mt-4 h-6 max-w-[220px] rounded bg-gray-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
          <div className="mt-6 h-14 w-full rounded-xl bg-[#1a472a]/30" />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[#e8f5e9] bg-white p-3 md:p-4">
              <div className="h-10 w-10 rounded-full bg-[#d4edda]/80" />
              <div className="mt-3 h-3 w-full rounded bg-gray-200" />
              <div className="mt-2 h-3 w-full rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReportErrorState({ title, body, reportId }: { title: string; body: string; reportId: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
        <AlertCircle className="h-9 w-9 text-orange-600" strokeWidth={2} />
      </div>
      <h1 className="mt-6 text-xl font-bold text-gray-900">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-gray-600">
        {body}{' '}
        {reportId ? (
          <span className="font-mono text-xs text-gray-800">({reportId})</span>
        ) : null}
      </p>
      <Link
        href="/booking/dashboard"
        className="mt-8 inline-flex rounded-lg bg-[#1a472a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#143622]"
      >
        Go back to Dashboard
      </Link>
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-9 w-9 text-red-600" strokeWidth={2} />
        </div>
        <h1 className="mt-6 text-xl font-bold text-gray-900">Report generation failed</h1>
        <p className="mt-3 max-w-md text-sm text-gray-600">
          Something went wrong generating your report. Please contact{' '}
          <a href="mailto:support@thebeetamin.com" className="font-semibold text-[#1a472a] underline">
            support@thebeetamin.com
          </a>{' '}
          with your Report ID:{' '}
          <span className="font-mono text-xs text-gray-900">{displayReportId}</span>
        </p>
        <Link
          href="/booking/dashboard"
          className="mt-8 inline-flex rounded-lg bg-[#1a472a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#143622]"
        >
          Go back to Dashboard
        </Link>
      </div>
    )
  }

  if (view === 'timeout') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-6 py-16 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#1a472a]" strokeWidth={2} />
        <h1 className="mt-6 text-xl font-bold text-gray-900">Still working on it</h1>
        <p className="mt-3 max-w-md text-sm text-gray-600">
          Your report is taking longer than usual. We&apos;ll email it to you when it&apos;s ready. You can close this
          page safely.
        </p>
        <p className="mt-4 font-mono text-xs text-gray-500">Report ID: {displayReportId}</p>
        <Link
          href="/booking/dashboard"
          className="mt-8 inline-flex rounded-lg border border-[#1a472a] px-6 py-3 text-sm font-semibold text-[#1a472a] hover:bg-[#f0fdf4]"
        >
          Go to Dashboard
        </Link>
      </div>
    )
  }

  if (view === 'loading' || view === 'generating') {
    return (
      <div className="min-h-screen bg-[#fafafa] pb-12">
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
      <script
        type="application/json"
        id="report-dl-config"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ reportId: displayReportId }) }}
      />
      <Script
        id="report-download-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){
  var cfg = document.getElementById('report-dl-config');
  if (!cfg) return;
  var reportId;
  try { reportId = JSON.parse(cfg.textContent || '{}').reportId; } catch (e) { return; }
  if (!reportId) return;
  function toast(msg) {
    var t = document.createElement('div');
    t.setAttribute('role', 'status');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#b91c1c;color:#fff;padding:12px 20px;border-radius:8px;z-index:9999;font-size:14px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,0.18);max-width:90vw;text-align:center;';
    document.body.appendChild(t);
    setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 4500);
  }
  function showRetry() {
    var w = document.getElementById('download-retry-wrap');
    if (w) w.style.display = 'block';
  }
  async function go() {
    var url = '/api/download-report?reportId=' + encodeURIComponent(reportId);
    try {
      var res = await fetch(url, { redirect: 'manual', credentials: 'include' });
      if (res.status === 302 || res.status === 307) {
        var loc = res.headers.get('Location');
        if (loc) { window.open(loc, '_blank', 'noopener,noreferrer'); return; }
      }
      if (res.ok) { window.open(url, '_blank', 'noopener,noreferrer'); return; }
      toast('Download failed, please try again');
      showRetry();
    } catch (err) {
      toast('Download failed, please try again');
      showRetry();
    }
  }
  document.querySelectorAll('[data-report-download]').forEach(function(el) {
    el.addEventListener('click', function(e) { e.preventDefault(); go(); });
  });
})();`,
        }}
      />

      <div className="min-h-screen bg-[#fafafa] pb-12">
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

            <button
              type="button"
              data-report-download
              className="mt-6 flex w-full scale-100 items-center justify-center gap-2 rounded-xl bg-[#1a472a] px-4 py-4 text-sm font-bold text-white transition hover:scale-[1.01] hover:bg-[#143622] md:text-base"
            >
              <Download className="h-5 w-5 shrink-0" strokeWidth={2.5} />
              Download My Recovery Plan (PDF)
            </button>

            <div id="download-retry-wrap" className="mt-3 hidden text-center">
              <button
                type="button"
                data-report-download
                className="text-sm font-semibold text-[#1a472a] underline underline-offset-2"
              >
                Try download again
              </button>
            </div>

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
              {[
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
              ].map(({ Icon, title, desc }) => (
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

        <div className="mx-auto mb-12 mt-8 max-w-lg px-4 text-center md:mt-8">
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
    </>
  )
}
