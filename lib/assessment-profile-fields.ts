/** Fields stored in `clients.assessment_meta` from the free quiz (`assessmentMeta` in localStorage). */
export function assessmentMetaString(
  meta: unknown,
  key: 'phone' | 'goal' | 'name' | 'email',
): string {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return ''
  const v = (meta as Record<string, unknown>)[key]
  return typeof v === 'string' ? v.trim() : ''
}

export function isPersistableFreeAssessment(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const o = v as Record<string, unknown>
  if (typeof o.deficiencyScore === 'number' && !Number.isNaN(o.deficiencyScore)) return true
  if (Array.isArray(o.primaryDeficiencies) && o.primaryDeficiencies.length > 0) return true
  if (Array.isArray(o.quickWins) && o.quickWins.length > 0) return true
  return false
}

export function clientProfileContactComplete(client: {
  phone?: string | null
  assessment_goal?: string | null
  assessment_meta?: unknown
} | null): boolean {
  if (!client) return false
  const phone =
    String(client.phone || '').trim() || assessmentMetaString(client.assessment_meta, 'phone')
  const goal =
    String(client.assessment_goal || '').trim() || assessmentMetaString(client.assessment_meta, 'goal')
  return Boolean(phone && goal)
}
