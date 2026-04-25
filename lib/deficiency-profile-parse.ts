export type DeficiencyItem = {
  nutrient: string
  severity: string
  reason: string
  symptoms: string[]
}

/** paid_reports.deficiency_summary: legacy array or { overallScore?, deficiencies[] } */
export function parseDeficiencySummaryPayload(raw: unknown): {
  overallScore: number | null
  deficiencies: DeficiencyItem[]
} {
  if (!raw) return { overallScore: null, deficiencies: [] }
  if (Array.isArray(raw)) {
    const deficiencies = raw.map(parseOne).filter((x): x is DeficiencyItem => x !== null)
    return { overallScore: null, deficiencies }
  }
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>
    const score =
      typeof o.overallScore === 'number' && !Number.isNaN(o.overallScore) ? o.overallScore : null
    const arr = o.deficiencies
    if (!Array.isArray(arr)) {
      return { overallScore: score, deficiencies: [] }
    }
    const deficiencies = arr.map(parseOne).filter((x): x is DeficiencyItem => x !== null)
    return { overallScore: score, deficiencies }
  }
  return { overallScore: null, deficiencies: [] }
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
