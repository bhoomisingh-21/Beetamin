'use client'

import {
  readAssessmentBundle,
  writeAssessmentBundle,
  type AssessmentBundle,
} from '@/lib/assessment-local-storage'
import { normalizeFreeAssessment } from '@/lib/assessment-profile-fields'

/** Push browser quiz results to Supabase (`clients.assessment_result`). */
export async function syncLocalAssessmentToProfile(_clerkUserId?: string): Promise<boolean> {
  const bundle = readAssessmentBundle()
  if (bundle) {
    const normalized = normalizeFreeAssessment(bundle.assessmentResult)
    if (normalized) {
      try {
        const res = await fetch('/api/sync-free-assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentResult: normalized,
            assessmentMeta: bundle.assessmentMeta,
          }),
        })
        if (res.ok) return true
      } catch {
        /* fall through — still allow checkout if browser has quiz */
      }
      return true
    }
  }

  try {
    const statusRes = await fetch('/api/sync-free-assessment', { cache: 'no-store' })
    if (!statusRes.ok) return false
    const status = (await statusRes.json()) as {
      hasOnFile?: boolean
      assessmentResult?: unknown
      assessmentMeta?: unknown
    }
    const restored = normalizeFreeAssessment(status.assessmentResult)
    if (status.hasOnFile && restored) {
      writeAssessmentBundle({
        assessmentResult: restored,
        assessmentMeta:
          status.assessmentMeta &&
          typeof status.assessmentMeta === 'object' &&
          !Array.isArray(status.assessmentMeta)
            ? (status.assessmentMeta as Record<string, unknown>)
            : null,
      })
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}

export function readLocalFreeAssessmentSnapshot(): Record<string, unknown> | null {
  const bundle = readAssessmentBundle()
  if (!bundle) return null
  return normalizeFreeAssessment(bundle.assessmentResult)
}

export function readLocalAssessmentMeta(): Record<string, unknown> | null {
  return readAssessmentBundle()?.assessmentMeta ?? null
}

export function hasLocalFreeAssessment(): boolean {
  return readAssessmentBundle() !== null
}

export async function fetchRestoredAssessmentBundle(): Promise<AssessmentBundle | null> {
  const local = readAssessmentBundle()
  if (local) return local

  try {
    const res = await fetch('/api/sync-free-assessment', { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as {
      hasOnFile?: boolean
      assessmentResult?: unknown
      assessmentMeta?: unknown
    }
    const restored = normalizeFreeAssessment(data.assessmentResult)
    if (!data.hasOnFile || !restored) return null

    const bundle: AssessmentBundle = {
      assessmentResult: restored,
      assessmentMeta:
        data.assessmentMeta &&
        typeof data.assessmentMeta === 'object' &&
        !Array.isArray(data.assessmentMeta)
          ? (data.assessmentMeta as Record<string, unknown>)
          : null,
    }
    writeAssessmentBundle(bundle)
    return bundle
  } catch {
    return null
  }
}
