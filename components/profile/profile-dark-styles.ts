/** Shared dark profile section surface (sessions-style) */
export const darkCard =
  'rounded-3xl border border-white/[0.08] bg-[#111820] p-6 md:p-8 shadow-sm'

export const darkCardSm = 'rounded-2xl border border-white/[0.08] bg-[#111820] p-5'

export const heading = 'text-xl font-black text-white tracking-tight'

export const subheading = 'mt-1 text-sm text-gray-400'

export function deficiencyScorePresentation(score: number): {
  textClass: string
  barClass: string
  label: string
} {
  if (score <= 25)
    return {
      textClass: 'text-emerald-400',
      barClass: 'from-emerald-500/30 to-emerald-600/10',
      label: 'Healthy Profile',
    }
  if (score <= 45)
    return {
      textClass: 'text-yellow-400',
      barClass: 'from-yellow-500/30 to-yellow-600/10',
      label: 'Mild Risk',
    }
  if (score <= 65)
    return {
      textClass: 'text-orange-400',
      barClass: 'from-orange-500/30 to-orange-600/10',
      label: 'Moderate Risk',
    }
  return {
    textClass: 'text-red-400',
    barClass: 'from-red-500/30 to-red-600/10',
    label: 'High Risk',
  }
}

export function severityPillDark(sev: string) {
  if (sev === 'high') return 'bg-red-500/15 text-red-400 border-red-500/35'
  if (sev === 'medium') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/35'
  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
}
