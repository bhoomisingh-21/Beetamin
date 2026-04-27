export type DeficiencyItem = {
  nutrient: string
  severity: string
  reason: string
  symptoms: string[]
}

function parseUrgency(o: Record<string, unknown>): string | null {
  const u =
    typeof o.urgencyMessage === 'string'
      ? o.urgencyMessage
      : typeof o.urgency_message === 'string'
        ? o.urgency_message
        : typeof o.urgency === 'string'
          ? o.urgency
          : null
  const t = u?.trim()
  return t ? t : null
}

/** paid_reports.deficiency_summary: legacy array or { overallScore?, deficiencies[], urgencyMessage? } */
export function parseDeficiencySummaryPayload(raw: unknown): {
  overallScore: number | null
  deficiencies: DeficiencyItem[]
  urgencyMessage: string | null
} {
  if (!raw) return { overallScore: null, deficiencies: [], urgencyMessage: null }
  if (Array.isArray(raw)) {
    const deficiencies = raw.map(parseOne).filter((x): x is DeficiencyItem => x !== null)
    return { overallScore: null, deficiencies, urgencyMessage: null }
  }
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>
    const score =
      typeof o.overallScore === 'number' && !Number.isNaN(o.overallScore) ? o.overallScore : null
    const arr = o.deficiencies
    if (!Array.isArray(arr)) {
      return { overallScore: score, deficiencies: [], urgencyMessage: parseUrgency(o) }
    }
    const deficiencies = arr.map(parseOne).filter((x): x is DeficiencyItem => x !== null)
    return { overallScore: score, deficiencies, urgencyMessage: parseUrgency(o) }
  }
  return { overallScore: null, deficiencies: [], urgencyMessage: null }
}

function parseOne(item: unknown): DeficiencyItem | null {
  if (!item || typeof item !== 'object') return null
  const o = item as Record<string, unknown>
  const sev = o.severity
  const severity =
    sev === 'high' || sev === 'medium' || sev === 'low' ? String(sev) : 'low'
  const symptoms = Array.isArray(o.symptoms)
    ? (o.symptoms as unknown[]).filter((s): s is string => typeof s === 'string')
    : []
  return {
    nutrient: typeof o.nutrient === 'string' ? o.nutrient : String(o.nutrient ?? ''),
    severity,
    reason:
      typeof o.reason === 'string'
        ? o.reason
        : typeof o.explanation === 'string'
          ? o.explanation
          : '',
    symptoms,
  }
}
