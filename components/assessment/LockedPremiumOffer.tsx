'use client'

import { Lock, UtensilsCrossed, Gauge, Pill, ClipboardList, ChevronRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const LOCKED_ITEMS = [
  {
    Icon: UtensilsCrossed,
    title: 'Your 7-day Indian meal plan',
    tease: 'Breakfast → dinner, already portioned',
  },
  {
    Icon: Gauge,
    title: 'Your calorie & nutrient targets',
    tease: 'The exact numbers for your body',
  },
  {
    Icon: Pill,
    title: 'Your supplement stack',
    tease: 'What to take, skip, and when',
  },
  {
    Icon: ClipboardList,
    title: 'Your daily playbook',
    tease: 'A week you can actually follow',
  },
] as const

export function LockedPremiumOffer({
  onUnlock,
  unlocking,
  error,
}: {
  onUnlock: () => void
  unlocking?: boolean
  error?: string | null
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#111810] p-5 sm:p-8"
    >
      <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />

      <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
        <Sparkles size={11} />
        Your personalised plan
      </p>

      <h2 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">
        We already built your next 7 days.
        <span className="block text-emerald-400">It&apos;s just sitting behind a lock.</span>
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-400">
        The gaps? You&apos;ve seen them. The meals, the calories, the supplements? Those are ready.
        Unlock the whole plan for <span className="font-bold text-emerald-400">just ₹39</span> — less than a cold coffee.
      </p>

      <div className="relative mt-6">
        <div className="space-y-2.5">
          {LOCKED_ITEMS.map(({ Icon, title, tease }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-3.5 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1 blur-[2.5px] select-none">
                <p className="text-sm font-semibold text-white/90 leading-snug">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{tease}</p>
              </div>
              <Lock size={14} className="shrink-0 text-emerald-400/80" />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-[#111810] via-[#111810]/40 to-transparent" />
      </div>

      <div className="relative mt-2 flex items-end gap-3">
        <p className="text-base text-gray-500 line-through decoration-gray-500">₹199</p>
        <p className="text-5xl font-black leading-none text-white">₹39</p>
        <p className="mb-1 text-sm font-semibold text-emerald-400">yes, really.</p>
      </div>

      <button
        type="button"
        onClick={onUnlock}
        disabled={unlocking}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-4 text-base font-black text-black shadow-[0_0_24px_rgba(16,185,129,0.28)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
      >
        {unlocking ? 'Loading…' : 'Unlock my plan — ₹39'}
        <ChevronRight size={18} />
      </button>
      {error ? <p className="mt-3 text-center text-sm font-medium text-red-400">{error}</p> : null}
      <p className="mt-3 text-center text-xs text-gray-500">Private · Yours in minutes · No guesswork</p>
    </motion.section>
  )
}

export function MobileStickyOfferBar({
  onUnlock,
  unlocking,
}: {
  onUnlock: () => void
  unlocking?: boolean
}) {
  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-emerald-500/20 bg-[#0A0F0A]/95 backdrop-blur-md px-4 pt-3"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400">Just</p>
          <p className="text-xl font-black text-white leading-tight">₹39</p>
        </div>
        <button
          type="button"
          onClick={onUnlock}
          disabled={unlocking}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-500 py-3.5 text-sm font-black text-black disabled:opacity-60"
        >
          {unlocking ? 'Loading…' : 'Unlock my personalised plan'}
        </button>
      </div>
    </div>
  )
}
