/** Whether localStorage assessment payload has anything worth rendering */
export function hasFreeAssessmentContent(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const o = data as Record<string, unknown>
  if (typeof o.deficiencyScore === 'number' && !Number.isNaN(o.deficiencyScore)) return true
  if (Array.isArray(o.primaryDeficiencies) && o.primaryDeficiencies.length > 0) return true
  if (Array.isArray(o.quickWins) && o.quickWins.length > 0) return true
  return false
}
