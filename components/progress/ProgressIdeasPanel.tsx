'use client'

import {
  Apple,
  Brain,
  Droplets,
  Footprints,
  Moon,
  Sparkles,
  Sun,
  Timer,
} from 'lucide-react'
import { profileCard, textSecondary } from '@/components/profile/profile-dark-styles'

type Idea = {
  icon: typeof Sparkles
  title: string
  blurb: string
}

const QUICK_WINS: Idea[] = [
  {
    icon: Sun,
    title: 'Outdoor minute',
    blurb: 'Two laps around the block or balcony sunlight — vitamin D likes consistency.',
  },
  {
    icon: Droplets,
    title: 'Hydration anchor',
    blurb: 'Pair water with something you already do: first sip after alarm or before coffee.',
  },
  {
    icon: Footprints,
    title: 'Movement snack',
    blurb: 'Five flights of stairs or a kitchen dance break counts; spikes energy without a gym pass.',
  },
  {
    icon: Apple,
    title: 'Protein bump',
    blurb: 'Add Greek yogurt, eggs, dal, or tofu to the meal you usually rush — steadier afternoons.',
  },
  {
    icon: Timer,
    title: 'Screen sunset',
    blurb: 'Dim screens 45 minutes before bed; your sleep logger will thank you tomorrow.',
  },
  {
    icon: Brain,
    title: 'Brain dump',
    blurb: 'Jot three bullets in Daily Notes: wins, worries, tomorrow’s tiny priority.',
  },
  {
    icon: Moon,
    title: 'Wind-down ritual',
    blurb: 'Same playlist or stretch sequence nightly — cues tell your body sleep is coming.',
  },
  {
    icon: Sparkles,
    title: 'Streak psychology',
    blurb: 'Log right after brushing teeth or lunch — habits stick when glued to existing anchors.',
  },
]

export function ProgressIdeasPanel() {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#0C1117]/80 p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.04),0_8px_32px_rgba(0,0,0,0.35)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#F0F4F8]">Playful picks & useful nudges</h2>
          <p className={`mt-1 max-w-xl text-sm ${textSecondary}`}>
            Mix these with your trackers — tiny experiments beat perfect streaks.
          </p>
          <div className="mt-3 h-[3px] w-10 rounded-full bg-emerald-500" aria-hidden />
        </div>
        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          Try one today
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {QUICK_WINS.map(({ icon: Icon, title, blurb }) => (
          <div
            key={title}
            className={`${profileCard} flex flex-col gap-2 p-4 transition hover:border-emerald-500/20`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
              <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </div>
            <p className="text-[13px] font-bold leading-snug text-[#F0F4F8]">{title}</p>
            <p className={`text-[11px] leading-relaxed ${textSecondary}`}>{blurb}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
