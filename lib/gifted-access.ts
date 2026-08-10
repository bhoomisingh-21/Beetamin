import { randomBytes, randomUUID } from 'crypto'

import { clerkClient } from '@clerk/nextjs/server'

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

/** Placeholder clerk_user_id prefixes used for clients who haven't signed up yet. */
export function isPlaceholderClerkId(clerkUserId: string | null | undefined): boolean {
  const id = String(clerkUserId ?? '')
  return !id || id.startsWith('pending_gift_') || id.startsWith('invite_pending_')
}

type ClientGiftLookupRow = {
  id: string
  clerk_user_id: string
  email: string
  name: string | null
  status: string | null
  sessions_total: number | null
  sessions_remaining: number | null
  plan_end_date: string | null
}

async function findClerkUserByEmail(email: string): Promise<{ id: string; name: string } | null> {
  try {
    const cc = await clerkClient()
    const { data } = await cc.users.getUserList({ emailAddress: [email], limit: 1 })
    const user = data[0]
    if (!user?.id) return null
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.username?.trim() ||
      email.split('@')[0]
    return { id: user.id, name }
  } catch (e) {
    console.error('[findClerkUserByEmail]', e)
    return null
  }
}

async function findClientByEmail(email: string): Promise<ClientGiftLookupRow | null> {
  const normalized = email.trim().toLowerCase()
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('id, clerk_user_id, email, name, status, sessions_total, sessions_remaining, plan_end_date')
    .ilike('email', normalized)
    .maybeSingle()

  if (error) {
    console.error('[findClientByEmail]', error)
    return null
  }
  if (!data) return null
  return data as ClientGiftLookupRow
}

/** Link a pending-gift / invite row to a real Clerk account when the person has already signed up. */
export async function reconcilePendingClientWithClerk(
  client: Pick<ClientGiftLookupRow, 'id' | 'clerk_user_id' | 'email' | 'name'>,
): Promise<boolean> {
  if (!isPlaceholderClerkId(client.clerk_user_id)) return true

  const email = String(client.email ?? '')
    .trim()
    .toLowerCase()
  if (!email) return false

  const clerkUser = await findClerkUserByEmail(email)
  if (!clerkUser) return false

  const patch: Record<string, unknown> = {
    clerk_user_id: clerkUser.id,
    email,
  }
  if (!String(client.name ?? '').trim()) {
    patch.name = clerkUser.name
  }

  const { error } = await supabaseAdmin.from('clients').update(patch).eq('id', client.id)
  if (error) {
    console.error('[reconcilePendingClientWithClerk]', error)
    return false
  }
  return true
}

function fullPlanSessionPatch(client: ClientGiftLookupRow): Record<string, unknown> | null {
  const noSessionsLeft =
    Number(client.sessions_total ?? 0) <= 0 || Number(client.sessions_remaining ?? 0) <= 0
  const planExpired = !client.plan_end_date || new Date(client.plan_end_date) < new Date()
  if (!noSessionsLeft && !planExpired && client.status === 'active') return null

  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 3)
  return {
    status: 'active',
    sessions_total: 6,
    sessions_used: 0,
    sessions_remaining: 6,
    plan_start_date: startDate.toISOString().slice(0, 10),
    plan_end_date: endDate.toISOString().slice(0, 10),
  }
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
  /** True until the person signs up — the row's clerk_user_id is still a placeholder. */
  pending: boolean
}

export async function listGiftedClients(): Promise<GiftedAccessListRow[]> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('id, clerk_user_id, email, name, gifted_plan, gifted_note, gifted_at')
    .eq('is_gifted_access', true)
    .not('gifted_plan', 'is', null)
    .order('gifted_at', { ascending: false })

  if (error) {
    console.error('[listGiftedClients]', error)
    return []
  }

  const rows = data || []
  await Promise.all(
    rows
      .filter((row) => isPlaceholderClerkId(String(row.clerk_user_id ?? '')))
      .map((row) =>
        reconcilePendingClientWithClerk({
          id: String(row.id),
          clerk_user_id: String(row.clerk_user_id ?? ''),
          email: String(row.email ?? ''),
          name: row.name != null ? String(row.name) : null,
        }),
      ),
  )

  const { data: refreshed } = await supabaseAdmin
    .from('clients')
    .select('id, clerk_user_id, email, gifted_plan, gifted_note, gifted_at')
    .eq('is_gifted_access', true)
    .not('gifted_plan', 'is', null)
    .order('gifted_at', { ascending: false })

  return (refreshed || rows).map((row) => ({
    id: String(row.id),
    clerk_user_id: String(row.clerk_user_id ?? ''),
    email: String(row.email ?? ''),
    gifted_plan: row.gifted_plan as GiftedPlan,
    gifted_note: row.gifted_note != null ? String(row.gifted_note) : null,
    gifted_at: String(row.gifted_at ?? ''),
    pending: isPlaceholderClerkId(row.clerk_user_id),
  }))
}

export async function grantGiftAccessByEmail(args: {
  email: string
  plan: GiftedPlan
  note?: string
  name?: string
}): Promise<{ ok: true; email: string; plan: GiftedPlan; pending: boolean } | { ok: false; error: string }> {
  const email = args.email.trim().toLowerCase()
  if (!email) return { ok: false, error: 'Email is required.' }

  let client = await findClientByEmail(email)
  const clerkUser = await findClerkUserByEmail(email)

  if (client && isPlaceholderClerkId(client.clerk_user_id)) {
    await reconcilePendingClientWithClerk(client)
    client = await findClientByEmail(email)
  }

  const giftFields = {
    is_gifted_access: true,
    gifted_plan: args.plan,
    gifted_at: new Date().toISOString(),
    gifted_note: args.note?.trim() || null,
  }

  if (client) {
    const patch: Record<string, unknown> = { ...giftFields, email }

    if (args.plan === 'full_plan') {
      const sessionPatch = fullPlanSessionPatch(client)
      if (sessionPatch) Object.assign(patch, sessionPatch)
    }

    const { error: updErr } = await supabaseAdmin.from('clients').update(patch).eq('id', client.id)
    if (updErr) {
      console.error('[grantGiftAccessByEmail] update', updErr)
      return { ok: false, error: 'Could not grant access.' }
    }

    const refreshed = await findClientByEmail(email)
    const pending = isPlaceholderClerkId(refreshed?.clerk_user_id ?? client.clerk_user_id)
    return { ok: true, email, plan: args.plan, pending }
  }

  if (clerkUser) {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 3)
    const name = args.name?.trim() || clerkUser.name

    const { error: upsertErr } = await supabaseAdmin.from('clients').upsert(
      {
        clerk_user_id: clerkUser.id,
        name,
        email,
        phone: '',
        plan_start_date: startDate.toISOString().slice(0, 10),
        plan_end_date: endDate.toISOString().slice(0, 10),
        status: 'active',
        sessions_total: args.plan === 'full_plan' ? 6 : 0,
        sessions_used: 0,
        sessions_remaining: args.plan === 'full_plan' ? 6 : 0,
        ...giftFields,
      },
      { onConflict: 'email' },
    )

    if (upsertErr) {
      console.error('[grantGiftAccessByEmail] upsert existing clerk user', upsertErr)
      return { ok: false, error: 'Could not grant access to this signed-in user.' }
    }

    return { ok: true, email, plan: args.plan, pending: false }
  }

  // No Clerk account yet — create a placeholder row keyed by email.
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 3)
  const name = args.name?.trim() || email.split('@')[0]

  const { error: insErr } = await supabaseAdmin.from('clients').insert({
    clerk_user_id: `pending_gift_${randomUUID()}`,
    name,
    email,
    phone: '',
    plan_start_date: startDate.toISOString().slice(0, 10),
    plan_end_date: endDate.toISOString().slice(0, 10),
    status: 'active',
    sessions_total: args.plan === 'full_plan' ? 6 : 0,
    sessions_used: 0,
    sessions_remaining: args.plan === 'full_plan' ? 6 : 0,
    ...giftFields,
  })

  if (insErr) {
    console.error('[grantGiftAccessByEmail] insert', insErr)
    return { ok: false, error: 'Could not create a pending account for this email.' }
  }

  return { ok: true, email, plan: args.plan, pending: true }
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
