'use client'

import {
  readAssessmentBundle,
  writeAssessmentBundle,
  type AssessmentBundle,
} from '@/lib/assessment-local-storage'
import { isPersistableFreeAssessment } from '@/lib/assessment-profile-fields'

/** Push browser quiz results to Supabase (`clients.assessment_result`). */
export async function syncLocalAssessmentToProfile(_clerkUserId?: string): Promise<boolean> {
  const bundle = readAssessmentBundle()
  if (bundle) {
    try {
      const res = await fetch('/api/sync-free-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentResult: bundle.assessmentResult,
          assessmentMeta: bundle.assessmentMeta,
        }),
      })
      if (res.ok) return true
    } catch {
      /* fall through to server restore */
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
    if (status.hasOnFile && isPersistableFreeAssessment(status.assessmentResult)) {
      writeAssessmentBundle({
        assessmentResult: status.assessmentResult,
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
  return readAssessmentBundle()?.assessmentResult ?? null
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
    if (!data.hasOnFile || !isPersistableFreeAssessment(data.assessmentResult)) return null

    const bundle: AssessmentBundle = {
      assessmentResult: data.assessmentResult,
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
