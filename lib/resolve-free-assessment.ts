import { normalizeFreeAssessment } from '@/lib/assessment-profile-fields'
import { persistFreeAssessmentForClerkUser } from '@/lib/persist-free-assessment'
import { restoreFreeAssessmentForClerkUser } from '@/lib/restore-free-assessment'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type ResolveFreeAssessmentInput = {
  clerkUserId: string
  /** Paid follow-up assessment row — may already store free_assessment_snapshot */
  detailedAssessmentId?: string | null
  snapshot?: unknown
  assessmentMeta?: unknown | null
}

/**
 * Best-effort: browser snapshot → DB persist → guest email restore → existing client row.
 * Returns normalized quiz JSON for PayU / PDF even if persist logs a warning.
 */
export async function resolveFreeAssessmentForCheckout(
  input: ResolveFreeAssessmentInput,
): Promise<Record<string, unknown> | null> {
  const normalizedSnapshot = normalizeFreeAssessment(input.snapshot)
  if (normalizedSnapshot) {
    try {
      await persistFreeAssessmentForClerkUser({
        clerkUserId: input.clerkUserId,
        freeAssessment: normalizedSnapshot,
        assessmentMeta: input.assessmentMeta ?? null,
      })
    } catch (err) {
      console.error('[resolve-free-assessment] persist snapshot', err)
    }
    return normalizedSnapshot
  }

  const detailedId = input.detailedAssessmentId?.trim()
  if (detailedId) {
    const { data: detailed, error: dErr } = await supabaseAdmin
      .from('detailed_assessments')
      .select('user_id, free_assessment_snapshot, free_assessment_meta')
      .eq('id', detailedId)
      .maybeSingle()

    if (!dErr && detailed && String(detailed.user_id) === input.clerkUserId) {
      const fromDetailed = normalizeFreeAssessment(detailed.free_assessment_snapshot)
      if (fromDetailed) {
        try {
          await persistFreeAssessmentForClerkUser({
            clerkUserId: input.clerkUserId,
            freeAssessment: fromDetailed,
            assessmentMeta: detailed.free_assessment_meta ?? input.assessmentMeta ?? null,
          })
        } catch (err) {
          console.error('[resolve-free-assessment] persist from detailed row', err)
        }
        return fromDetailed
      }
    }
  }

  const restored = await restoreFreeAssessmentForClerkUser(input.clerkUserId)
  if (restored) {
    return normalizeFreeAssessment(restored.assessmentResult) ?? restored.assessmentResult
  }

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('assessment_result')
    .eq('clerk_user_id', input.clerkUserId)
    .maybeSingle()

  return normalizeFreeAssessment(client?.assessment_result)
}
