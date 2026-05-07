import { supabaseAdmin } from '@/lib/supabase-admin'

/** Terminal states that count as a "completed" purchased report row for tier checks. */
const COMPLETED_REPORT_STATUSES = ['ready', 'generated', 'completed'] as const

export type SessionBookingAccess = {
  /** True only when latest completed paid_reports row has amount === 3999 (Full Recovery Plan). */
  allowed: boolean
  reason: 'full_plan' | 'report_only' | 'no_completed_report'
  latestCompletedAmount: number | null
}

/**
 * ₹3,999 full plan must appear as paid_reports.amount = 3999 when that purchase exists.
 * ₹39 personalised report rows use amount = 39. No completed row ⇒ no session booking.
 */
export async function getSessionBookingAccess(clerkUserId: string): Promise<SessionBookingAccess> {
  const { data, error } = await supabaseAdmin
    .from('paid_reports')
    .select('amount')
    .eq('user_id', clerkUserId)
    .in('status', [...COMPLETED_REPORT_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[getSessionBookingAccess]', error)
    return { allowed: false, reason: 'no_completed_report', latestCompletedAmount: null }
  }

  const amt = data?.amount != null ? Number(data.amount) : null
  if (amt === 3999) return { allowed: true, reason: 'full_plan', latestCompletedAmount: amt }
  if (amt === 39) return { allowed: false, reason: 'report_only', latestCompletedAmount: amt }
  if (amt == null)
    return { allowed: false, reason: 'no_completed_report', latestCompletedAmount: null }
  /* Other experimental amounts → treat as report-only tier */
  return { allowed: false, reason: 'report_only', latestCompletedAmount: amt }
}
