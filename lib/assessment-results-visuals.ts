import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Brain,
  Droplets,
  Dumbbell,
  Fish,
  FlaskConical,
  Leaf,
  Pill,
  Shield,
  Sun,
  Zap,
} from 'lucide-react'

export type NutrientGapVisual = {
  nutrient: string
  severity: string
  reason: string
  optimalPct: number
  levelLabel: string
  levelTone: 'critical' | 'low' | 'mild'
  Icon: LucideIcon
  iconLabel?: string
}

export type ImpactVisual = {
  title: string
  caption: string
  dots: number
  tone: 'high' | 'moderate' | 'low'
  Icon: LucideIcon
}

export type FocusChip = {
  label: string
  Icon: LucideIcon
  tone: 'energy' | 'protect' | 'immune'
}

export type ActionStepVisual = {
  title: string
  body: string
  Icon: LucideIcon
}

function answersFromMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const nested = meta.answers
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>
  }
  return {}
}

function str(meta: Record<string, unknown>, key: string): string {
  const v = meta[key]
  return typeof v === 'string' ? v : ''
}

export function riskLabel(score: number): { label: string; tone: 'high' | 'moderate' | 'low' } {
  if (score >= 60) return { label: 'High Risk', tone: 'high' }
  if (score >= 35) return { label: 'Moderate Risk', tone: 'moderate' }
  return { label: 'Low Risk', tone: 'low' }
}

export function optimalPctForSeverity(severity: string, index: number): number {
  const s = severity.toLowerCase()
  const jitter = [0, 4, -3, 2][index % 4]
  if (s === 'high') return Math.max(10, 15 + jitter)
  if (s === 'medium' || s === 'moderate') return Math.max(22, 32 + jitter)
  return Math.max(38, 48 + jitter)
}

export function levelFromSeverity(severity: string): { label: string; tone: NutrientGapVisual['levelTone'] } {
  const s = severity.toLowerCase()
  if (s === 'high') return { label: 'Very Low', tone: 'critical' }
  if (s === 'medium' || s === 'moderate') return { label: 'Low', tone: 'low' }
  return { label: 'Mild gap', tone: 'mild' }
}

export function nutrientIcon(nutrient: string): { Icon: LucideIcon; iconLabel?: string } {
  const n = nutrient.toLowerCase()
  if (n.includes('d3') || n.includes('vitamin d') || n.includes('sun')) return { Icon: Sun }
  if (n.includes('b12') || n.includes('b-12') || n.includes('folate') || n.includes('b9')) return { Icon: Pill }
  if (n.includes('zinc') || n === 'zn') return { Icon: Shield, iconLabel: 'Zn' }
  if (n.includes('iron') || n.includes('ferritin')) return { Icon: Droplets }
  if (n.includes('omega') || n.includes('dha') || n.includes('epa')) return { Icon: Fish }
  if (n.includes('magnesium') || n.includes('calcium')) return { Icon: Leaf }
  return { Icon: Pill }
}

function shortImpact(reason?: string): string {
  const raw = (reason || 'May be affecting how you feel day to day.').trim()
  const first = raw.split(/[.!?]/)[0]?.trim() || raw
  return first.length > 78 ? `${first.slice(0, 76)}…` : first
}

export function mapNutrientGaps(
  deficiencies: { nutrient?: string; severity?: string; reason?: string }[],
): NutrientGapVisual[] {
  return deficiencies.slice(0, 3).map((def, i) => {
    const nutrient = def.nutrient?.trim() || 'Key nutrient'
    const severity = def.severity || 'medium'
    const { Icon, iconLabel } = nutrientIcon(nutrient)
    const level = levelFromSeverity(severity)
    return {
      nutrient,
      severity,
      reason: shortImpact(def.reason),
      optimalPct: optimalPctForSeverity(severity, i),
      levelLabel: level.label,
      levelTone: level.tone,
      Icon,
      iconLabel,
    }
  })
}

function impactFromSignal(value: number): Pick<ImpactVisual, 'dots' | 'tone' | 'caption'> {
  if (value >= 4) return { dots: 4, tone: 'high', caption: 'High Impact' }
  if (value >= 3) return { dots: 3, tone: 'moderate', caption: 'Moderate Impact' }
  return { dots: 2, tone: 'low', caption: 'Mild Impact' }
}

export function mapImpactAreas(meta: Record<string, unknown>): ImpactVisual[] {
  const answers = answersFromMeta(meta)
  const energy = typeof answers.energyLevel === 'string' ? answers.energyLevel : str(meta, 'metabolicRhythm')
  const clarity = typeof answers.mentalClarity === 'string' ? answers.mentalClarity : ''
  const muscle = typeof answers.muscleRecovery === 'string' ? answers.muscleRecovery : ''
  const symptoms = Array.isArray(answers.physicalSymptoms)
    ? answers.physicalSymptoms.filter((s): s is string => typeof s === 'string')
    : Array.isArray(meta.dermalMarkers)
      ? meta.dermalMarkers.filter((s): s is string => typeof s === 'string')
      : []

  const energyScore =
    energy === 'major_crash' ? 5 : energy === 'unpredictable' ? 4 : energy === 'slight_dip' ? 3 : 2
  const fogScore =
    clarity === 'severe' || clarity === 'frequent_fog' ? 4 : clarity === 'occasional_fog' ? 3 : 2
  const jointScore = symptoms.includes('joint_issues') ? 4 : symptoms.filter((s) => s !== 'none' && s !== 'unsure').length >= 2 ? 3 : 2
  const muscleScore = muscle === 'severe' || muscle === 'moderate' ? 4 : muscle === 'mild' ? 3 : 2

  return [
    { title: 'Low Energy', Icon: Zap, ...impactFromSignal(energyScore) },
    { title: 'Brain Fog', Icon: Brain, ...impactFromSignal(fogScore) },
    { title: 'Joint Discomfort', Icon: Activity, ...impactFromSignal(jointScore) },
    { title: 'Muscle Soreness', Icon: Dumbbell, ...impactFromSignal(muscleScore) },
  ]
}

export function mapFocusChips(goal: string, gaps: NutrientGapVisual[]): FocusChip[] {
  const chips: FocusChip[] = []
  const g = goal.toLowerCase()
  if (g.includes('energy') || g.includes('focus')) chips.push({ label: 'Boost Energy', Icon: Zap, tone: 'energy' })
  if (g.includes('recover') || g.includes('joint') || g.includes('muscle')) {
    chips.push({ label: 'Protect Joints', Icon: Shield, tone: 'protect' })
  }
  if (g.includes('immun')) chips.push({ label: 'Strengthen Immunity', Icon: Shield, tone: 'immune' })
  if (g.includes('skin') || g.includes('hair')) chips.push({ label: 'Skin & Hair', Icon: Leaf, tone: 'protect' })
  if (g.includes('weight')) chips.push({ label: 'Steady Energy', Icon: Zap, tone: 'energy' })

  const joined = gaps.map((x) => x.nutrient.toLowerCase()).join(' ')
  if (joined.includes('d') && chips.length < 3) chips.push({ label: 'Boost Energy', Icon: Zap, tone: 'energy' })
  if (joined.includes('zinc') && chips.length < 3) {
    chips.push({ label: 'Strengthen Immunity', Icon: Shield, tone: 'immune' })
  }

  const defaults: FocusChip[] = [
    { label: 'Boost Energy', Icon: Zap, tone: 'energy' },
    { label: 'Protect Joints', Icon: Shield, tone: 'protect' },
    { label: 'Strengthen Immunity', Icon: Leaf, tone: 'immune' },
  ]
  for (const d of defaults) {
    if (chips.length >= 3) break
    if (!chips.some((c) => c.label === d.label)) chips.push(d)
  }
  return chips.slice(0, 3)
}

const ACTION_ICONS: LucideIcon[] = [Fish, Sun, FlaskConical]

export function mapActionSteps(quickWins: string[]): ActionStepVisual[] {
  return quickWins.slice(0, 3).map((raw, i) => {
    const text = raw.trim()
    const split = text.split(/\s+[—–-]\s+|:\s+/)
    if (split.length > 1 && split[0].length <= 42) {
      return { title: split[0].trim(), body: split.slice(1).join(' — ').trim(), Icon: ACTION_ICONS[i] ?? Leaf }
    }
    const words = text.split(' ')
    const title = words.slice(0, 5).join(' ')
    const body = words.length > 5 ? words.slice(5).join(' ') : text
    return { title: title.replace(/[.,]$/, ''), body, Icon: ACTION_ICONS[i] ?? Leaf }
  })
}

export function headlineParts(score: number, name: string): {
  greeting: string
  lead: string
  emphasis: string
  conjunction: string
  hope: string
  subtext: string
} {
  const first = name.trim() || 'there'
  if (score <= 25) {
    return {
      greeting: `Hi ${first},`,
      lead: 'Your nutrient profile looks',
      emphasis: 'strong',
      conjunction: ', and it’s',
      hope: 'sustainable.',
      subtext: 'Your answers suggest your body is getting most of what it needs. A few focused habits will keep it that way.',
    }
  }
  if (score <= 45) {
    return {
      greeting: `Hi ${first},`,
      lead: 'Your body is sending',
      emphasis: 'early signals',
      conjunction: ', but they’re',
      hope: 'fixable.',
      subtext: 'Your results show nutrient gaps that may be starting to affect your energy and recovery.',
    }
  }
  return {
    greeting: `Hi ${first},`,
    lead: 'Your body is',
    emphasis: 'struggling',
    conjunction: ', but it’s',
    hope: 'fixable.',
    subtext: 'Your results show nutrient gaps that may be affecting your energy, immunity and overall well-being.',
  }
}

export function riskSummary(score: number): string {
  if (score >= 60) {
    return `A score of ${score} flags multiple moderate-to-high deficiencies that may be holding you back.`
  }
  if (score >= 35) {
    return `A score of ${score} suggests a few nutrient gaps worth correcting before they get louder.`
  }
  return `A score of ${score} is relatively low — keep the habits that are working and close the remaining gaps.`
}
