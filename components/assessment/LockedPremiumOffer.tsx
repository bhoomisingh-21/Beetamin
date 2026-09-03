'use client'

import { Lock, UtensilsCrossed, Gauge, Pill, ClipboardList, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

const LOCKED_ITEMS = [
  {
    Icon: UtensilsCrossed,
    title: 'Your 7-Day Personalized Meal Plan',
    subtitle: 'Indian meals built around your assessment',
  },
  {
    Icon: Gauge,
    title: 'Your Calorie Deficit Target',
    subtitle: 'The exact calorie target to follow',
  },
  {
    Icon: Pill,
    title: 'Your Supplement Recommendations',
    subtitle: 'Personalized, food-first guidance',
  },
  {
    Icon: ClipboardList,
    title: 'Your Personalized Action Plan',
    subtitle: 'A clear daily nutrition strategy',
  },
] as const

export function LockedPremiumOffer({
  onUnlock,
  unlocking,
  error,
  tone = 'dark',
}: {
  onUnlock: () => void
  unlocking?: boolean
  error?: string | null
  tone?: 'dark' | 'light'
}) {
  const light = tone === 'light'
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative overflow-hidden rounded-2xl md:rounded-3xl p-5 sm:p-7 md:p-10 ${
        light
          ? 'border border-emerald-100 bg-white shadow-sm'
          : 'border border-emerald-500/20 bg-[#121821]'
      }`}
    >
      <div className="pointer-events-none absolute -top-16 right-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${light ? 'text-emerald-600' : 'text-emerald-400'}`}>
        Want to know exactly what to do next?
      </p>
      <h2 className={`mt-2 text-2xl sm:text-3xl font-black leading-tight ${light ? 'text-gray-900' : 'text-white'}`}>
        Unlock your complete
        <span className={`block ${light ? 'text-emerald-600' : 'text-emerald-400'}`}>personalized plan</span>
      </h2>
      <p className={`mt-2 text-sm max-w-md ${light ? 'text-gray-500' : 'text-gray-400'}`}>
        Your snapshot shows where to focus. The full report turns that into meals, targets, and a plan you can follow this week.
      </p>

      <div className="mt-6 space-y-2.5">
        {LOCKED_ITEMS.map(({ Icon, title, subtitle }) => (
          <div
            key={title}
            className={`flex items-start gap-3 rounded-xl px-3.5 py-3 ${
              light ? 'border border-gray-100 bg-gray-50' : 'border border-white/6 bg-black/25'
            }`}
          >
            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              light ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold leading-snug ${light ? 'text-gray-900' : 'text-white/90'}`}>{title}</p>
              <p className={`text-xs mt-0.5 ${light ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>
            </div>
            <Lock size={14} className="mt-1 shrink-0 text-gray-400" />
          </div>
        ))}
      </div>

      <div className="mt-7 flex items-end gap-3">
        <p className="text-lg text-gray-400 line-through decoration-gray-400/80">₹199</p>
        <p className={`text-4xl sm:text-5xl font-black leading-none ${light ? 'text-gray-900' : 'text-white'}`}>₹39</p>
        <p className={`mb-1 text-xs font-semibold uppercase tracking-widest ${light ? 'text-emerald-600' : 'text-emerald-400'}`}>only</p>
      </div>
      <p className={`mt-1.5 text-sm ${light ? 'text-gray-500' : 'text-gray-400'}`}>Unlock my complete health report</p>

      <button
        type="button"
        onClick={onUnlock}
        disabled={unlocking}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-4 text-base font-black text-black shadow-[0_0_24px_rgba(16,185,129,0.25)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
      >
        {unlocking ? 'Loading…' : 'Get My 7-Day Plan for ₹39'}
        <ChevronRight size={18} />
      </button>
      {error ? <p className={`mt-3 text-center text-sm font-medium ${light ? 'text-red-600' : 'text-red-400'}`}>{error}</p> : null}
      <p className="mt-3 text-center text-xs text-gray-500">Private · Personalized PDF · Doctor-reviewed format</p>
    </motion.section>
  )
}

export function MobileStickyOfferBar({
  onUnlock,
  unlocking,
  tone = 'dark',
}: {
  onUnlock: () => void
  unlocking?: boolean
  tone?: 'dark' | 'light'
}) {
  const light = tone === 'light'
  return (
    <div
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 border-t px-4 pt-3 backdrop-blur-md ${
        light ? 'border-gray-200 bg-white/95' : 'border-emerald-500/20 bg-[#0B0F14]/95'
      }`}
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <p className="text-xs text-gray-400 line-through leading-none">₹199</p>
          <p className={`text-xl font-black leading-tight ${light ? 'text-gray-900' : 'text-white'}`}>₹39</p>
        </div>
        <button
          type="button"
          onClick={onUnlock}
          disabled={unlocking}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-500 py-3.5 text-sm font-black text-black disabled:opacity-60"
        >
          {unlocking ? 'Loading…' : 'Unlock My Full Report →'}
        </button>
      </div>
    </div>
  )
}
