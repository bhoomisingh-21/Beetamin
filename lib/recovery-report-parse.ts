import type { RecoveryReportSections } from '@/lib/recovery-report-types'

const REQUIRED: (keyof RecoveryReportSections)[] = [
  'deficiencyAnalysis',
  'mealPlan',
  'supplements',
  'blockingFoods',
  'dailyRoutine',
  'doctorNote',
  'disclaimer',
]

const OPTIONAL_TEXT: (keyof RecoveryReportSections)[] = [
  'healthScoreSummary',
  'smartInsights',
  'ninetyDayTimeline',
  'premiumValueStatement',
]

/** Parse Groq JSON into RecoveryReportSections (required + optional premium fields). */
export function parseRecoverySectionsJson(raw: string): RecoveryReportSections {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }
  const parsed = JSON.parse(text) as Partial<Record<keyof RecoveryReportSections, unknown>>
  const placeholder = (k: string) =>
    `[${k} — content being prepared. Please contact support if this persists.]`

  const out = {} as RecoveryReportSections

  for (const k of REQUIRED) {
    const v = parsed[k]
    out[k] = typeof v === 'string' && v.trim() ? v.trim() : placeholder(String(k))
  }

  for (const k of OPTIONAL_TEXT) {
    const v = parsed[k]
    if (typeof v === 'string' && v.trim()) {
      out[k] = v.trim()
    }
  }

  return out
}
