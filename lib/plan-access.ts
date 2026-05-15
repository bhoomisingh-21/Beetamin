import { supabaseAdmin } from '@/lib/supabase-admin'

/** Active Core Transformation (full) purchase — used for booster gate and pricing CTAs. */
export async function hasActiveFullPlanPurchase(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('plan', 'full')
    .eq('status', 'active')
    .maybeSingle()
  return !!data
}

export type ActivePurchaseRow = {
  plan: string
  status: string
  sessions_used: number | null
  sessions_total: number | null
}

/** Prefer full plan row; else latest active purchase. */
export async function getActivePurchaseForSessions(userId: string): Promise<ActivePurchaseRow | null> {
  const { data: fullRow } = await supabaseAdmin
    .from('purchases')
    .select('plan, status, sessions_used, sessions_total')
    .eq('user_id', userId)
    .eq('plan', 'full')
    .eq('status', 'active')
    .maybeSingle()

  if (fullRow) return fullRow as ActivePurchaseRow

  const { data: anyRow } = await supabaseAdmin
    .from('purchases')
    .select('plan, status, sessions_used, sessions_total')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (anyRow as ActivePurchaseRow | null) ?? null
}

export function formatPurchaseSessionsLabel(p: ActivePurchaseRow | null): {
  used: number
  total: number
  shortLabel: string
  detailLabel: string
} {
  if (!p) {
    return {
      used: 0,
      total: 0,
      shortLabel: '0 / 0',
      detailLabel: 'No active plan',
    }
  }

  const used = Math.max(0, Number(p.sessions_used ?? 0))
  let total = Math.max(0, Number(p.sessions_total ?? 0))
  if (total === 0) {
    if (p.plan === 'full') total = 6
    else if (p.plan === 'booster') total = 1
  }

  if (p.plan === 'full') {
    return {
      used,
      total,
      shortLabel: `${used} / ${total}`,
      detailLabel: `${used} / ${total} sessions used`,
    }
  }
  if (p.plan === 'booster') {
    return {
      used,
      total: total || 1,
      shortLabel: `${used} / ${total || 1}`,
      detailLabel: `${used} / 1 session used`,
    }
  }

  return {
    used,
    total,
    shortLabel: `${used} / ${total}`,
    detailLabel: `${used} / ${total} sessions`,
  }
}
