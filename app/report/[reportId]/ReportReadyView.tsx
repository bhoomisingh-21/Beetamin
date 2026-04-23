'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Download,
  Mail,
  UtensilsCrossed,
  Pill,
  CalendarClock,
  Ban,
  Sparkles,
  Stethoscope,
  LayoutDashboard,
} from 'lucide-react'

type Props = {
  reportId: string
  patientName: string
  email: string
}

export function ReportReadyView({ reportId, patientName, email }: Props) {
  const [dlError, setDlError] = useState('')

  function handleDownload() {
    setDlError('')
    try {
      const url = `/api/download-report?reportId=${encodeURIComponent(reportId)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setDlError('Could not open the download. Try again or use the link from your email.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-sm font-bold text-emerald-800">The Beetamin</span>
          <Link href="/booking/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            My Sessions
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="h-11 w-11 text-white" strokeWidth={2.5} />
          </div>
        </motion.div>

        <h1 className="mt-8 text-center text-2xl font-black text-gray-900">Your Recovery Plan is Ready!</h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Prepared for <span className="font-semibold text-gray-900">{patientName}</span>
        </p>
        <p className="mt-1 text-center text-xs text-gray-500">
          Report ID: <span className="font-mono font-medium text-gray-800">{reportId}</span>
        </p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleDownload}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700"
          >
            <Download className="h-5 w-5" />
            Download My Recovery Plan (PDF)
          </button>
          {dlError && <p className="text-center text-sm text-red-600">{dlError}</p>}
          <p className="flex items-center justify-center gap-2 text-center text-sm text-gray-600">
            <Mail className="h-4 w-4 shrink-0 text-emerald-600" />A copy has been sent to <span className="font-medium">{email}</span>
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Inside your report</p>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            {[
              { icon: Stethoscope, label: 'Deficiency analysis with severity guidance' },
              { icon: UtensilsCrossed, label: '7-day Indian meal plan with timings' },
              { icon: Pill, label: 'Supplement plan with brands and dosages' },
              { icon: Ban, label: 'Foods and habits that may slow recovery' },
              { icon: CalendarClock, label: 'Personalised daily routine' },
              { icon: Sparkles, label: 'Personal note from Dr. Priya Sharma' },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          Found this helpful? Share The Beetamin with someone who could use clearer nutrition guidance.
        </p>

        <Link
          href="/booking/dashboard"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
        >
          <LayoutDashboard className="h-4 w-4" />
          Back to dashboard
        </Link>
      </main>
    </div>
  )
}
