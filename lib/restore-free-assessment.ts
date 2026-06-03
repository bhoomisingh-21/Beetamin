import { currentUser } from '@clerk/nextjs/server'

import { isPersistableFreeAssessment } from '@/lib/assessment-profile-fields'
import { persistFreeAssessmentForClerkUser } from '@/lib/persist-free-assessment'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type RestoredFreeAssessment = {
  assessmentResult: Record<string, unknown>
  assessmentMeta: unknown | null
  source: 'client' | 'guest_email'
}

/** Load free quiz for signed-in user from `clients` or pre-auth guest snapshot (same email). */
export async function restoreFreeAssessmentForClerkUser(
  clerkUserId: string,
): Promise<RestoredFreeAssessment | null> {
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('assessment_result, assessment_meta')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  if (isPersistableFreeAssessment(client?.assessment_result)) {
    return {
      assessmentResult: client.assessment_result as Record<string, unknown>,
      assessmentMeta: client?.assessment_meta ?? null,
      source: 'client',
    }
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? ''
  if (!email) return null

  const { data: guest, error: guestErr } = await supabaseAdmin
    .from('guest_free_assessments')
    .select('assessment_result, assessment_meta')
    .eq('email', email)
    .maybeSingle()

  if (guestErr) {
    console.error('[restore-free-assessment] guest lookup', guestErr)
    return null
  }

  if (!isPersistableFreeAssessment(guest?.assessment_result)) return null

  const assessmentResult = guest.assessment_result as Record<string, unknown>
  const assessmentMeta = guest.assessment_meta ?? null

  try {
    await persistFreeAssessmentForClerkUser({
      clerkUserId,
      freeAssessment: assessmentResult,
      assessmentMeta,
    })
  } catch (err) {
    console.error('[restore-free-assessment] persist guest snapshot', err)
  }

  return { assessmentResult, assessmentMeta, source: 'guest_email' }
}
