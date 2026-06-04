import { currentUser } from '@clerk/nextjs/server'

import {
  assessmentMetaString,
  normalizeFreeAssessment,
} from '@/lib/assessment-profile-fields'
import { supabaseAdmin } from '@/lib/supabase-admin'

type ClientPatchRow = {
  phone?: string
  assessment_goal?: string
  assessment_result: unknown
  assessment_meta: unknown | null
}

function assessmentProfilePatch(
  input: { assessmentResult: unknown; assessmentMeta: unknown | null },
  existing: { phone?: string | null; assessment_goal?: string | null } | null,
): ClientPatchRow {
  const metaPhone = assessmentMetaString(input.assessmentMeta, 'phone')
  const metaGoal = assessmentMetaString(input.assessmentMeta, 'goal')
  const phone = String(existing?.phone || '').trim() || metaPhone
  const goal = String(existing?.assessment_goal || '').trim() || metaGoal

  return {
    assessment_result: input.assessmentResult,
    assessment_meta: input.assessmentMeta,
    ...(phone ? { phone } : {}),
    ...(goal ? { assessment_goal: goal } : {}),
  }
}

async function getClientRowByClerkId(clerkUserId: string) {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('id, clerk_user_id, phone, assessment_goal, assessment_result')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

/** Ensures `clients.assessment_result` exists for PayU / PDF generation. */
export async function persistFreeAssessmentForClerkUser(input: {
  clerkUserId: string
  freeAssessment: Record<string, unknown>
  assessmentMeta?: unknown | null
}) {
  const normalized = normalizeFreeAssessment(input.freeAssessment)
  if (!normalized) {
    throw new Error('Invalid free assessment payload')
  }

  const existing = await getClientRowByClerkId(input.clerkUserId)
  const patch = assessmentProfilePatch(
    { assessmentResult: normalized, assessmentMeta: input.assessmentMeta ?? null },
    existing,
  )

  if (existing) {
    const { error } = await supabaseAdmin
      .from('clients')
      .update(patch)
      .eq('clerk_user_id', input.clerkUserId)
    if (error) throw new Error(error.message)
    return
  }

  const clerkUser = await currentUser()
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    `noemail_${input.clerkUserId}@beetamin.internal`
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 3)

  const { error: insErr } = await supabaseAdmin.from('clients').insert({
    clerk_user_id: input.clerkUserId,
    name: clerkUser?.fullName || clerkUser?.firstName || 'User',
    email,
    phone: assessmentMetaString(input.assessmentMeta, 'phone'),
    ...patch,
    plan_start_date: startDate.toISOString().split('T')[0],
    plan_end_date: endDate.toISOString().split('T')[0],
    status: 'active',
    sessions_total: 6,
    sessions_used: 0,
    sessions_remaining: 6,
  })

  if (insErr?.code === '23505') {
    const emailLower = email.toLowerCase()
    const { data: byEmail } = await supabaseAdmin
      .from('clients')
      .select('id, clerk_user_id')
      .eq('email', emailLower)
      .maybeSingle()
    const match = byEmail as { id: string; clerk_user_id: string | null } | null
    if (match?.id) {
      const { error: fixErr } = await supabaseAdmin
        .from('clients')
        .update({ clerk_user_id: input.clerkUserId, ...patch })
        .eq('id', match.id)
      if (fixErr) throw new Error(fixErr.message)
      return
    }

    const { data: byClerk } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('clerk_user_id', input.clerkUserId)
      .maybeSingle()
    if (byClerk?.id) {
      const { error: fixErr } = await supabaseAdmin
        .from('clients')
        .update(patch)
        .eq('clerk_user_id', input.clerkUserId)
      if (fixErr) throw new Error(fixErr.message)
      return
    }
  }
  if (insErr) throw new Error(insErr.message)
}
