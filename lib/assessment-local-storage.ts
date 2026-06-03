import { isPersistableFreeAssessment } from '@/lib/assessment-profile-fields'

const LS_RESULT = 'assessmentResult'
const LS_META = 'assessmentMeta'
const SS_RESULT = 'beetamin.assessmentResult'
const SS_META = 'beetamin.assessmentMeta'
export const ASSESSMENT_AUTH_RETURN = '/assessment/results'

export type AssessmentBundle = {
  assessmentResult: Record<string, unknown>
  assessmentMeta: Record<string, unknown> | null
}

function parseMeta(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as unknown
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** Persist free quiz in localStorage + sessionStorage (survives sign-in on same tab). */
export function writeAssessmentBundle(bundle: AssessmentBundle): void {
  if (typeof window === 'undefined') return
  const resultJson = JSON.stringify(bundle.assessmentResult)
  const metaJson = bundle.assessmentMeta ? JSON.stringify(bundle.assessmentMeta) : ''
  try {
    localStorage.setItem(LS_RESULT, resultJson)
    if (metaJson) localStorage.setItem(LS_META, metaJson)
    else localStorage.removeItem(LS_META)
    sessionStorage.setItem(SS_RESULT, resultJson)
    if (metaJson) sessionStorage.setItem(SS_META, metaJson)
    else sessionStorage.removeItem(SS_META)
    sessionStorage.setItem('beetamin.authReturnAfter', ASSESSMENT_AUTH_RETURN)
  } catch {
    /* private mode */
  }
}

/** Read guest quiz: localStorage first, then sessionStorage backup. */
export function readAssessmentBundle(): AssessmentBundle | null {
  if (typeof window === 'undefined') return null

  const sources: [string, string][] = [
    [LS_RESULT, LS_META],
    [SS_RESULT, SS_META],
  ]

  for (const [resultKey, metaKey] of sources) {
    try {
      const raw = localStorage.getItem(resultKey) ?? sessionStorage.getItem(resultKey)
      if (!raw) continue
      const parsed: unknown = JSON.parse(raw)
      if (!isPersistableFreeAssessment(parsed)) continue
      const metaRaw = localStorage.getItem(metaKey) ?? sessionStorage.getItem(metaKey)
      return {
        assessmentResult: parsed,
        assessmentMeta: parseMeta(metaRaw),
      }
    } catch {
      continue
    }
  }
  return null
}

export function markAssessmentAuthReturn(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem('beetamin.authReturnAfter', ASSESSMENT_AUTH_RETURN)
  } catch {
    /* ignore */
  }
}

export function consumeAssessmentAuthReturn(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const v = sessionStorage.getItem('beetamin.authReturnAfter')
    return v && v.startsWith('/') ? v : null
  } catch {
    return null
  }
}
