/** Fields stored in `clients.assessment_meta` from the free quiz (`assessmentMeta` in localStorage). */
export function assessmentMetaString(
  meta: unknown,
  key: 'phone' | 'goal' | 'name' | 'email',
): string {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return ''
  const v = (meta as Record<string, unknown>)[key]
  return typeof v === 'string' ? v.trim() : ''
}

/** Coerce Groq / localStorage payloads into a shape we can store and validate. */
export function normalizeFreeAssessment(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const raw = v as Record<string, unknown>
  const o = { ...raw }

  if (typeof o.deficiencyScore === 'string') {
    const n = Number(o.deficiencyScore)
    if (!Number.isNaN(n)) o.deficiencyScore = n
  }

  return isPersistableFreeAssessment(o) ? o : null
}

export function isPersistableFreeAssessment(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const o = v as Record<string, unknown>
  if (typeof o.deficiencyScore === 'number' && !Number.isNaN(o.deficiencyScore)) return true
  if (Array.isArray(o.primaryDeficiencies) && o.primaryDeficiencies.length > 0) return true
  if (Array.isArray(o.quickWins) && o.quickWins.length > 0) return true
  if (Array.isArray(o.insights) && o.insights.length > 0) return true
  if (typeof o.dietSummary === 'string' && o.dietSummary.trim().length > 0) return true
  if (typeof o.urgencyMessage === 'string' && o.urgencyMessage.trim().length > 0) return true
  return false
}

export function clientProfileContactComplete(client: {
  phone?: string | null
  assessment_goal?: string | null
  assessment_meta?: unknown
} | null): boolean {
  const { phone, goal } = resolveClientProfileFields(client)
  return Boolean(phone && goal)
}

/** Phone and goal for display — falls back to quiz `assessment_meta`. */
export function resolveClientProfileFields(client: {
  phone?: string | null
  assessment_goal?: string | null
  assessment_meta?: unknown
} | null): { phone: string; goal: string } {
  if (!client) return { phone: '', goal: '' }
  const phone =
    String(client.phone || '').trim() || assessmentMetaString(client.assessment_meta, 'phone')
  const goal =
    String(client.assessment_goal || '').trim() || assessmentMetaString(client.assessment_meta, 'goal')
  return { phone, goal }
}
