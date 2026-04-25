'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CalendarDays, User } from 'lucide-react'

export function ReportAppHeader() {
  const router = useRouter()
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="sticky top-0 z-30 border-b border-stone-200/90 bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span>Back</span>
        </button>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/profile"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-[#1a472a]/30 hover:text-[#1a472a]"
          >
            <User className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="hidden sm:inline">My Profile</span>
          </Link>
          <Link
            href="/sessions"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1a472a] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#143622]"
          >
            <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="hidden sm:inline">My Sessions</span>
          </Link>
        </div>
      </div>
    </motion.header>
  )
}
