'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
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
import Footer from '@/components/sections/Footer'
import { ReportAppHeader } from '@/components/report/ReportAppHeader'

const REPORT_INSIDE_ITEMS = [
  {
    Icon: Microscope,
    title: 'Deficiency Analysis',
    subtitle: 'Your top deficiencies identified with severity levels',
  },
  {
    Icon: UtensilsCrossed,
    title: '7-Day Meal Plan',
    subtitle: 'Daily Indian meals targeting your exact deficiencies',
  },
  {
    Icon: Pill,
    title: 'Supplement Guide',
    subtitle: '1-2 safe supplements with exact dosage and brands',
  },
  {
    Icon: Ban,
    title: 'Foods to Avoid',
    subtitle: 'Specific foods blocking your recovery and why',
  },
  {
    Icon: CalendarDays,
    title: 'Daily Routine',
    subtitle: 'A realistic recovery schedule built for your lifestyle',
  },
  {
    Icon: Stethoscope,
    title: "Doctor's Note",
    subtitle: 'Personal note from Dr. Priya Sharma, Nutritionist',
  },
] as const

function ReportDownloadPrimaryButton({
  status,
  onPress,
}: {
  status: 'idle' | 'loading' | 'success' | 'error'
  onPress: () => void
}) {
  const busy = status === 'loading'
  const done = status === 'success'
  const failed = status === 'error'
  const palette = done
    ? 'bg-emerald-700 text-white shadow-emerald-900/25 hover:bg-emerald-700'
    : failed
      ? 'bg-red-600 text-white shadow-red-900/20 hover:bg-red-700'
      : 'bg-gradient-to-r from-[#1a472a] to-[#143622] text-white shadow-[#1a472a]/30 hover:brightness-110 active:scale-[0.99]'
  return (
    <button
      type="button"
      onClick={() => {
        if (!busy && !done) void onPress()
      }}
      disabled={busy || done}
      className={`mt-6 flex w-full min-h-[52px] items-center justify-center gap-2.5 rounded-2xl px-5 py-4 text-sm font-bold shadow-lg transition md:mt-8 md:text-base disabled:cursor-not-allowed disabled:opacity-95 ${palette}`}
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

type Props = {
  displayReportId: string
  preparedDate: string
  displayName: string
  email: string
  downloadStatus: 'idle' | 'loading' | 'success' | 'error'
  onDownload: () => void
}

export function ReportReadyLayout({
  displayReportId,
  preparedDate,
  displayName,
  email,
  downloadStatus,
  onDownload,
}: Props) {
  return (
    <div className="min-h-screen bg-[#f6f7f4] text-stone-900">
      <ReportAppHeader />

      <section className="relative overflow-hidden bg-[#1a2e1a] px-4 py-10 text-white sm:px-6 sm:py-14 md:py-16">
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/5 blur-2xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-[2.65rem] md:leading-[1.1]">
              Your Recovery Plan is Ready!
            </h1>
            <p className="mt-4 text-sm text-white/85 sm:text-base">
              Prepared by <span className="font-semibold text-white">Dr. Priya Sharma</span>
              <span className="text-white/70"> · Clinical Nutritionist</span>
            </p>
            <p className="mt-2 text-sm text-white/75">Prepared on {preparedDate}</p>
            <div className="mt-5 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 font-mono text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm sm:text-xs lg:justify-start">
              <span className="text-emerald-200/90">Report ID</span>
              <span className="break-all text-left">{displayReportId}</span>
            </div>
          </motion.div>

          <motion.div
            className="flex justify-center lg:justify-end"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.08 }}
          >
            <div className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
              <motion.div
                className="absolute inset-0 rounded-full bg-emerald-400/20"
                animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.25, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-2xl shadow-black/25 ring-4 ring-white/30 sm:h-40 sm:w-40">
                <Check className="h-16 w-16 text-[#1a2e1a] sm:h-20 sm:w-20" strokeWidth={2.75} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(26,71,42,0.06),transparent)]"
          aria-hidden
        />

        <div className="relative grid gap-8 lg:grid-cols-5 lg:gap-10">
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xl shadow-stone-200/30 ring-1 ring-stone-100/80 lg:col-span-3 md:p-8"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a472a]/80">Download</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-stone-900 md:text-2xl">
              {displayName} Recovery Plan
            </h2>
            <p className="mt-1 text-sm text-stone-500">Plan date · {preparedDate}</p>
            <p className="mt-4 text-sm leading-relaxed text-stone-600">
              Your clinician-formatted PDF is secured in your account. Download anytime — a copy was also sent to your
              inbox.
            </p>
            <ReportDownloadPrimaryButton status={downloadStatus} onPress={onDownload} />
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-[#f0fdf4] to-emerald-50/50 p-4 md:p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-emerald-100">
                <Mail className="h-5 w-5 text-[#166534]" strokeWidth={2} />
              </div>
              <p className="text-left text-sm leading-snug text-[#14532d]">
                <span className="font-semibold text-[#166534]">Emailed copy</span>
                <span className="text-emerald-900/80">
                  {' '}
                  — sent to {email ? <span className="font-medium break-all">{email}</span> : 'your email on file'}
                </span>
              </p>
            </div>
          </motion.article>

          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="flex flex-col gap-6 lg:col-span-2"
          >
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-lg shadow-stone-200/25 ring-1 ring-stone-100/80">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Trust</p>
              <ul className="mt-4 space-y-4 text-sm font-medium text-stone-800">
                <li className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#1a472a]" strokeWidth={2} />
                  <span>100% Private &amp; Confidential</span>
                </li>
                <li className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1a472a]" strokeWidth={2} />
                  <span>Doctor Reviewed</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#1a472a]" strokeWidth={2} />
                  <span>Professional PDF</span>
                </li>
              </ul>
            </div>
            <Link
              href="/dashboard"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#1a472a]/25 bg-white px-5 py-3.5 text-sm font-bold text-[#1a472a] shadow-sm transition hover:border-[#1a472a]/40 hover:bg-[#f0fdf4]"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={2} />
              Go to Dashboard
            </Link>
          </motion.aside>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="relative mt-12 sm:mt-16"
        >
          <div className="mb-6 text-center lg:text-left">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Inside Your Report</h3>
            <p className="mt-1 text-sm text-stone-400">Six clinical sections</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {REPORT_INSIDE_ITEMS.map(({ Icon, title, subtitle }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200/80 hover:shadow-md sm:p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25">
                  <Icon className="h-5 w-5 text-[#1a472a]" strokeWidth={2} />
                </div>
                <p className="mt-3 text-sm font-bold text-stone-900">{title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{subtitle}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      <Footer />
    </div>
  )
}
