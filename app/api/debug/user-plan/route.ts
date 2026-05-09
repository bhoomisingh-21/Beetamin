import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSessionBookingAccess } from '@/lib/session-booking-access'

export const runtime = 'nodejs'

/**
 * Debug: authenticated user only. Returns raw paid_reports + appointments slices.
 * Temporary — remove or protect before production hardening.
 *
 * GET /api/debug/user-plan?userId=<optional, must match session>
 */
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const param = searchParams.get('userId')?.trim()
  if (param && param !== userId) {
    return NextResponse.json({ error: 'userId does not match signed-in user' }, { status: 403 })
  }

  const { data: reportRows } = await supabaseAdmin
    .from('paid_reports')
    .select('id, amount, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(40)

  const reports =
    reportRows?.map(
      (r: { id: string; amount?: number | null; status?: string | null; created_at?: string | null }) => ({
        id: r.id,
        amount: r.amount != null ? Number(r.amount) : null,
        status: r.status != null ? String(r.status) : null,
        created_at: r.created_at != null ? String(r.created_at) : null,
      }),
    ) ?? []

  const { data: clientRow } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  const cid = clientRow?.id ? String(clientRow.id) : null

  let sessions: { id: string; status: string | null; created_at: string | null }[] = []
  if (cid) {
    const { data: appts } = await supabaseAdmin
      .from('appointments')
      .select('id, status, created_at')
      .eq('client_id', cid)
      .order('created_at', { ascending: false })
      .limit(40)
    sessions =
      appts?.map((a: { id: string; status?: string | null; created_at?: string | null }) => ({
        id: a.id,
        status: a.status != null ? String(a.status) : null,
        created_at: a.created_at != null ? String(a.created_at) : null,
      })) ?? []
  }

  const access = await getSessionBookingAccess(userId)

  const has3999Completed = reports.some(
    (r) =>
      ['ready', 'generated', 'completed'].includes(String(r.status ?? '')) && Number(r.amount) === 3999,
  )

  const hasCompletedSession = sessions.some((s) => s.status === 'completed')

  console.log('[debug/user-plan]', {
    userId,
    reports: reports.length,
    sessions: sessions.length,
    qualifiesForFullPlan: access.allowed,
  })

  return NextResponse.json({
    reports,
    sessions,
    sessionBookingAccess: access,
    qualifiesForFullPlan: access.allowed,
    ruleFlags: {
      any3999_completed_report_row: has3999Completed,
      any_completed_appointment: hasCompletedSession,
    },
  })
}
