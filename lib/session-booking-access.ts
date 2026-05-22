import { supabaseAdmin } from '@/lib/supabase-admin'

/** Terminal states that count as a "completed" purchased report row for tier checks. */
const COMPLETED_REPORT_STATUSES = ['ready', 'generated', 'completed'] as const

export type SessionBookingAccess = {
  /**
   * True when an active full-plan purchase exists, a legacy completed ₹3,999 report exists,
   * or the user has any completed appointment row.
   */
  allowed: boolean
  reason: 'full_plan' | 'report_only' | 'no_completed_report'
  /** Max amount among all terminal report rows (for display / legacy checks). */
  latestCompletedAmount: number | null
}

/**
 * Session booking unlocks if:
 * - Any active Full Recovery Plan purchase exists, OR
 * - Any terminal `paid_reports` row for this user has `amount = 3999`, OR
 * - Any `appointments` row for their `clients` profile has `status = 'completed'`.
 *
 * We no longer look only at the single latest report (a later ₹39 regenerate would incorrectly lock the user out).
 */
export async function getSessionBookingAccess(clerkUserId: string): Promise<SessionBookingAccess> {
  const { data: gifted } = await supabaseAdmin
    .from('clients')
    .select('is_gifted_access, gifted_plan')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  if (gifted?.is_gifted_access === true && gifted.gifted_plan === 'full_plan') {
    return { allowed: true, reason: 'full_plan', latestCompletedAmount: 3999 }
  }

  const { data: purchaseRows, error: pErr } = await supabaseAdmin
    .from('purchases')
    .select('amount, status')
    .eq('user_id', clerkUserId)
    .eq('plan', 'full')
    .eq('amount', 3999)
    .in('status', ['active', 'pending_booking'])

  if (pErr) {
    console.error('[getSessionBookingAccess] purchases', pErr)
  }

  const { data: terminalRows, error: rErr } = await supabaseAdmin
    .from('paid_reports')
    .select('amount, status, created_at')
    .eq('user_id', clerkUserId)
    .in('status', [...COMPLETED_REPORT_STATUSES])

  if (rErr) {
    console.error('[getSessionBookingAccess] paid_reports', rErr)
    return { allowed: false, reason: 'no_completed_report', latestCompletedAmount: null }
  }

  const rows = terminalRows || []
  const amounts = rows.map((r) => Number((r as { amount?: unknown }).amount)).filter((n) => !Number.isNaN(n))
  const latestCompletedAmount = amounts.length ? Math.max(...amounts) : null
  const has3999Terminal = rows.some((r) => Number((r as { amount?: unknown }).amount) === 3999)
  const hasFullPurchase = (purchaseRows || []).some((r) => Number((r as { amount?: unknown }).amount) === 3999)

  const { data: clientRow } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  let completedAppointmentCount = 0
  const clientId = clientRow?.id as string | undefined
  if (clientId) {
    const { count, error: cErr } = await supabaseAdmin
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'completed')
    if (cErr) console.error('[getSessionBookingAccess] appointments count', cErr)
    completedAppointmentCount = typeof count === 'number' ? count : 0
  }

  const allowed = hasFullPurchase || has3999Terminal || completedAppointmentCount > 0

  const reason: SessionBookingAccess['reason'] = allowed
    ? 'full_plan'
    : amounts.length > 0
      ? 'report_only'
      : 'no_completed_report'

  console.log(
    '[getSessionBookingAccess]',
    JSON.stringify({
      clerkUserId,
      terminalReportCount: rows.length,
      amounts,
      hasFullPurchase,
      has3999Terminal,
      completedAppointmentCount,
      allowed,
      reason,
    }),
  )

  return { allowed, reason, latestCompletedAmount }
}
