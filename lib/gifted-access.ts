import { randomBytes } from 'crypto'

import { paymentAppBaseUrl } from '@/lib/payment-app-base-url'
import { makePayUTxnId } from '@/lib/payu'
import { runPaidReportGeneration } from '@/lib/run-paid-report-generation'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type GiftedPlan = 'report' | 'full_plan'

export type ClientGiftedRow = {
  clerk_user_id: string
  email: string | null
  name: string | null
  is_gifted_access: boolean
  gifted_plan: GiftedPlan | null
  gifted_at: string | null
  gifted_note: string | null
  assessment_result: unknown
}

function makeReportSlug() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const suffix = randomBytes(2).toString('hex').toUpperCase()
  return `BT-${y}${m}${d}-${suffix}`
}

export async function getClientGiftedAccess(clerkUserId: string): Promise<ClientGiftedRow | null> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select(
      'clerk_user_id, email, name, is_gifted_access, gifted_plan, gifted_at, gifted_note, assessment_result',
    )
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  if (error || !data) return null
  return data as ClientGiftedRow
}

export function giftedPlanMatchesPayment(
  giftedPlan: string | null | undefined,
  mode: 'upgrade' | 'new' | 'retake' | 'regenerate',
): boolean {
  if (!giftedPlan) return false
  if (mode === 'upgrade') return giftedPlan === 'full_plan'
  return giftedPlan === 'report'
}

export async function grantGiftedFullPlan(clerkUserId: string): Promise<{ redirectUrl: string }> {
  const base = paymentAppBaseUrl()
  const now = new Date()
  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() + 3)

  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('id, name, email')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  const email =
    (typeof client?.email === 'string' ? client.email.trim().toLowerCase() : '') ||
    `noemail_${clerkUserId.slice(-14)}@beetamin.internal`
  const name = (typeof client?.name === 'string' ? client.name.trim() : '') || 'Patient'

  const txnid = makePayUTxnId()
  await supabaseAdmin.from('purchases').insert({
    user_id: clerkUserId,
    plan: 'full',
    amount: 3999,
    txnid,
    payment_id: 'gifted',
    status: 'active',
    mode: 'upgrade',
    sessions_total: 6,
    sessions_used: 0,
  })

  const clientPatch = {
    clerk_user_id: clerkUserId,
    name,
    email,
    phone: '',
    plan_start_date: now.toISOString().split('T')[0],
    plan_end_date: endDate.toISOString().split('T')[0],
    status: 'active',
    sessions_total: 6,
    sessions_used: 0,
    sessions_remaining: 6,
  }

  if (client?.id) {
    await supabaseAdmin
      .from('clients')
      .update({
        plan_start_date: clientPatch.plan_start_date,
        plan_end_date: clientPatch.plan_end_date,
        status: clientPatch.status,
        sessions_total: clientPatch.sessions_total,
        sessions_used: clientPatch.sessions_used,
        sessions_remaining: clientPatch.sessions_remaining,
      })
      .eq('id', client.id)
  } else {
    await supabaseAdmin.from('clients').upsert(clientPatch, { onConflict: 'email' })
  }

  return { redirectUrl: `${base}/booking?full_plan_payment_success=1` }
}

export async function grantGiftedReport(args: {
  clerkUserId: string
  assessmentId: string
  email: string
  freeAssessmentSnapshot: unknown
}): Promise<{ redirectUrl: string; reportSlug: string }> {
  const base = paymentAppBaseUrl()
  const reportSlug = makeReportSlug()
  const pdfPath = `${args.clerkUserId}/${reportSlug}.pdf`
  const txnid = makePayUTxnId()

  const { data: insertRow, error: insErr } = await supabaseAdmin
    .from('paid_reports')
    .insert({
      user_id: args.clerkUserId,
      email: args.email.toLowerCase(),
      report_id: reportSlug,
      pdf_url: pdfPath,
      amount: 39,
      status: 'generating',
      assessment_id: args.assessmentId,
      payment_id: 'gifted',
      txnid,
      free_assessment_snapshot: args.freeAssessmentSnapshot,
      deficiency_summary: null,
    })
    .select('id')
    .single()

  if (insErr || !insertRow?.id) {
    throw new Error(insErr?.message || 'Could not create gifted report row.')
  }

  void runPaidReportGeneration({
    reportId: reportSlug,
    userId: args.clerkUserId,
    detailedAssessmentId: args.assessmentId,
  })

  return {
    redirectUrl: `${base}/report/${encodeURIComponent(reportSlug)}?payment_success=1`,
    reportSlug,
  }
}

export type GiftedAccessListRow = {
  id: string
  clerk_user_id: string
  email: string
  gifted_plan: GiftedPlan
  gifted_note: string | null
  gifted_at: string
}

export async function listGiftedClients(): Promise<GiftedAccessListRow[]> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('id, clerk_user_id, email, gifted_plan, gifted_note, gifted_at')
    .eq('is_gifted_access', true)
    .not('gifted_plan', 'is', null)
    .order('gifted_at', { ascending: false })

  if (error) {
    console.error('[listGiftedClients]', error)
    return []
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    clerk_user_id: String(row.clerk_user_id ?? ''),
    email: String(row.email ?? ''),
    gifted_plan: row.gifted_plan as GiftedPlan,
    gifted_note: row.gifted_note != null ? String(row.gifted_note) : null,
    gifted_at: String(row.gifted_at ?? ''),
  }))
}

export async function grantGiftAccessByEmail(args: {
  email: string
  plan: GiftedPlan
  note?: string
}): Promise<{ ok: true; email: string; plan: GiftedPlan } | { ok: false; error: string }> {
  const email = args.email.trim().toLowerCase()
  if (!email) return { ok: false, error: 'Email is required.' }

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('id, clerk_user_id, email')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    console.error('[grantGiftAccessByEmail]', error)
    return { ok: false, error: 'Database error. Try again.' }
  }

  if (!client?.clerk_user_id) {
    return {
      ok: false,
      error: 'No account found with this email. Ask them to sign up first.',
    }
  }

  const { error: updErr } = await supabaseAdmin
    .from('clients')
    .update({
      is_gifted_access: true,
      gifted_plan: args.plan,
      gifted_at: new Date().toISOString(),
      gifted_note: args.note?.trim() || null,
    })
    .eq('id', client.id)

  if (updErr) {
    console.error('[grantGiftAccessByEmail] update', updErr)
    return { ok: false, error: 'Could not grant access.' }
  }

  return { ok: true, email, plan: args.plan }
}

export async function revokeGiftAccess(clientId: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from('clients')
    .update({
      is_gifted_access: false,
      gifted_plan: null,
      gifted_at: null,
      gifted_note: null,
    })
    .eq('id', clientId)

  if (error) {
    console.error('[revokeGiftAccess]', error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
