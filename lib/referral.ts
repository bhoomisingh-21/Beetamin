'use server'

import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function sanitizeCodePart(nameOrEmail: string): string {
  return nameOrEmail.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase()
}

/** Base code from display name + stable suffix from client UUID (not Clerk id). */
export function generateReferralCode(name: string, clientUuid: string): string {
  const cleanName = sanitizeCodePart(name || 'USER') || 'USER'
  const compact = clientUuid.replace(/-/g, '').toUpperCase()
  const suffix = compact.slice(-4)
  return `${cleanName}${suffix}`.slice(0, 24)
}

async function persistReferralCode(clientId: string, desired: string): Promise<string> {
  let code = desired.slice(0, 24)
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data: clash } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('referral_code', code)
      .neq('id', clientId)
      .maybeSingle()
    if (!clash) {
      const { error } = await supabaseAdmin.from('clients').update({ referral_code: code }).eq('id', clientId)
      if (!error) return code
    }
    code = `${sanitizeCodePart(desired)}${randomSuffix()}`.slice(0, 24)
  }
  throw new Error('Could not assign referral code')
}

/** Ensures `clients.referral_code` exists for this Supabase client row. */
export async function ensureReferralCode(clientId: string, name: string, email: string): Promise<string> {
  const { data: row } = await supabaseAdmin
    .from('clients')
    .select('referral_code')
    .eq('id', clientId)
    .maybeSingle()

  if (row?.referral_code && String(row.referral_code).trim()) {
    return String(row.referral_code).trim().toUpperCase()
  }

  const base = name?.trim()
    ? sanitizeCodePart(name)
    : sanitizeCodePart(email.split('@')[0] || 'USER')
  const compact = clientId.replace(/-/g, '').toUpperCase()
  const suffix = compact.slice(-4)
  const desired = `${base || 'USER'}${suffix}`.slice(0, 24)
  return persistReferralCode(clientId, desired)
}

/** Links current Clerk user to a referrer by referral code (stored on `clients.referred_by`). */
export async function applyReferralCode(clerkUserId: string, referralCodeRaw: string): Promise<boolean> {
  const code = referralCodeRaw.toUpperCase().trim()
  if (!code) return false

  const { data: self } = await supabaseAdmin
    .from('clients')
    .select('id, referred_by, referral_code')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  if (!self?.id) return false
  if (self.referred_by && String(self.referred_by).trim()) return false
  if (self.referral_code && String(self.referral_code).trim().toUpperCase() === code) return false

  const { data: referrer } = await supabaseAdmin
    .from('clients')
    .select('id, total_referrals, referral_code')
    .eq('referral_code', code)
    .maybeSingle()

  if (!referrer?.id || referrer.id === self.id) return false

  const { error: upSelf } = await supabaseAdmin.from('clients').update({ referred_by: code }).eq('id', self.id)
  if (upSelf) return false

  const nextTotal = (referrer.total_referrals ?? 0) + 1
  await supabaseAdmin.from('clients').update({ total_referrals: nextTotal }).eq('id', referrer.id)

  return true
}

export type ReferralStatsPayload = {
  referralCode: string
  walletBalance: number
  totalReferrals: number
  successfulReferrals: number
  rewards: Array<{
    id: string
    referred_user_id: string
    session_id: string | null
    amount: number
    status: string
    created_at: string
    referred_name: string | null
    referred_joined: string | null
  }>
  transactions: Array<{
    id: string
    amount: number
    type: string
    description: string | null
    created_at: string
  }>
}

export async function getReferralStats(clientUuid: string): Promise<ReferralStatsPayload> {
  const { data: user } = await supabaseAdmin
    .from('clients')
    .select('referral_code, wallet_balance, total_referrals, successful_referrals')
    .eq('id', clientUuid)
    .maybeSingle()

  const { data: rewards } = await supabaseAdmin
    .from('referral_rewards')
    .select('id, referred_user_id, session_id, amount, status, created_at')
    .eq('referrer_id', clientUuid)
    .order('created_at', { ascending: false })

  const referredIds = [...new Set((rewards ?? []).map((r) => r.referred_user_id).filter(Boolean))]
  let nameMap = new Map<string, { name: string | null; created_at: string | null }>()
  if (referredIds.length > 0) {
    const { data: subs } = await supabaseAdmin
      .from('clients')
      .select('id, name, created_at')
      .in('id', referredIds)
    for (const row of subs ?? []) {
      nameMap.set(String((row as { id: string }).id), {
        name: (row as { name?: string }).name ?? null,
        created_at: (row as { created_at?: string }).created_at ?? null,
      })
    }
  }

  const { data: transactions } = await supabaseAdmin
    .from('wallet_transactions')
    .select('id, amount, type, description, created_at')
    .eq('user_id', clientUuid)
    .order('created_at', { ascending: false })
    .limit(10)

  const enriched = (rewards ?? []).map((r) => {
    const m = nameMap.get(r.referred_user_id)
    return {
      id: r.id,
      referred_user_id: r.referred_user_id,
      session_id: r.session_id,
      amount: r.amount,
      status: r.status,
      created_at: r.created_at,
      referred_name: m?.name ?? null,
      referred_joined: m?.created_at ?? null,
    }
  })

  return {
    referralCode: (user?.referral_code && String(user.referral_code).trim().toUpperCase()) || '',
    walletBalance: user?.wallet_balance ?? 0,
    totalReferrals: user?.total_referrals ?? 0,
    successfulReferrals: user?.successful_referrals ?? 0,
    rewards: enriched,
    transactions: (transactions ?? []) as ReferralStatsPayload['transactions'],
  }
}

// ─── Clerk-bound helpers for client components ─────────────────────────────────

export async function ensureReferralCodeAction(): Promise<{ ok: true; code: string } | { ok: false; reason: string }> {
  try {
    const { userId } = await auth()
    if (!userId) return { ok: false, reason: 'auth' }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, name, email')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (!client?.id) return { ok: false, reason: 'no_client' }

    const code = await ensureReferralCode(client.id, client.name ?? '', client.email ?? '')
    return { ok: true, code }
  } catch (e) {
    console.error('[ensureReferralCodeAction]', e)
    return { ok: false, reason: 'error' }
  }
}

export async function syncPendingReferralCodeAction(raw: string): Promise<boolean> {
  try {
    const { userId } = await auth()
    if (!userId || !raw?.trim()) return false
    return applyReferralCode(userId, raw)
  } catch (e) {
    console.error('[syncPendingReferralCodeAction]', e)
    return false
  }
}

export async function loadReferralDashboardAction(): Promise<
  ReferralStatsPayload | { error: 'auth' | 'no_client' | 'unknown' }
> {
  try {
    const { userId } = await auth()
    if (!userId) return { error: 'auth' }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, name, email')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (!client?.id) return { error: 'no_client' }

    await ensureReferralCode(client.id, client.name ?? '', client.email ?? '')
    return getReferralStats(client.id)
  } catch (e) {
    console.error('[loadReferralDashboardAction]', e)
    return { error: 'unknown' }
  }
}

export async function getWalletBalanceClerk(): Promise<number> {
  try {
    const { userId } = await auth()
    if (!userId) return 0
    const { data } = await supabaseAdmin
      .from('clients')
      .select('wallet_balance')
      .eq('clerk_user_id', userId)
      .maybeSingle()
    return data?.wallet_balance ?? 0
  } catch {
    return 0
  }
}
