/** Premium profile dashboard tokens */

export const profileBg = 'bg-[#060910]'
export const sidebarBg = 'bg-[#0C1117]'
export const cardBg = 'bg-[#0F1623]'
export const cardBorder = 'border border-white/[0.06]'

/** Emerald glow shadow per spec */
export const cardShadow =
  'shadow-[0_0_0_1px_rgba(16,185,129,0.05),0_4px_24px_rgba(0,0,0,0.4)]'

export const profileCard = `rounded-2xl ${cardBorder} ${cardBg} ${cardShadow}`

export const profileCardPadding = 'p-5 md:p-6'

export const textPrimary = 'text-[#F0F4F8]'
export const textSecondary = 'text-[#8B9AB0]'

export const pageTitle = `text-2xl font-black ${textPrimary} tracking-tight`
export const pageSubtitle = `mt-1 text-sm ${textSecondary}`

export const cardTitle = `text-[15px] font-semibold ${textPrimary}`
export const cardSubtitle = `text-xs ${textSecondary}`

/** Legacy exports — map to new system */
export const darkCard = `${profileCard} ${profileCardPadding}`
export const darkCardSm = `${profileCard} p-5`

export const heading = `text-xl font-black ${textPrimary} tracking-tight`
export const subheading = `mt-1 text-sm ${textSecondary}`

export function deficiencyScorePresentation(score: number): {
  textClass: string
  barClass: string
  label: string
  fillHex: string
} {
  if (score <= 25)
    return {
      textClass: 'text-emerald-400',
      barClass: 'from-emerald-500/25 to-emerald-900/20',
      label: 'Healthy',
      fillHex: '#34d399',
    }
  if (score <= 45)
    return {
      textClass: 'text-yellow-400',
      barClass: 'from-yellow-500/25 to-yellow-900/20',
      label: 'Mild Risk',
      fillHex: '#facc15',
    }
  if (score <= 65)
    return {
      textClass: 'text-orange-400',
      barClass: 'from-orange-500/25 to-orange-900/20',
      label: 'Moderate Risk',
      fillHex: '#fb923c',
    }
  return {
    textClass: 'text-red-400',
    barClass: 'from-red-500/25 to-red-900/20',
    label: 'High Risk',
    fillHex: '#f87171',
  }
}

export function severityPillDark(sev: string) {
  if (sev === 'high') return 'bg-red-500/15 text-red-400 border-red-500/35'
  if (sev === 'medium') return 'bg-amber-500/15 text-amber-400 border-amber-500/35'
  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
}
