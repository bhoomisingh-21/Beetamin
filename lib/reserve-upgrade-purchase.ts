import { makePayUTxnId } from '@/lib/payu'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type ReserveUpgradeResult =
  | { ok: true; id: string; txnid: string }
  | { ok: false; code: 'TABLE_MISSING' | 'INSERT_FAILED'; message: string; detail?: string }

function isMissingTableError(message: string, code?: string) {
  return (
    code === '42P01' ||
    /relation.*purchases.*does not exist/i.test(message) ||
    /Could not find the table/i.test(message)
  )
}

function isMissingColumnError(message: string, code?: string) {
  return (
    code === 'PGRST204' ||
    /column.*does not exist/i.test(message) ||
    /Could not find the 'sessions_/i.test(message)
  )
}

/**
 * Reserve (or reuse) a pending full-plan purchase row before PayU redirect.
 * Tries a minimal insert if optional session columns are absent in the DB.
 */
export async function reserveUpgradePurchase(
  userId: string,
  amountRupees: number,
): Promise<ReserveUpgradeResult> {
  const { data: pendingRows, error: findErr } = await supabaseAdmin
    .from('purchases')
    .select('id, txnid')
    .eq('user_id', userId)
    .eq('plan', 'full')
    .eq('status', 'pending')
    .eq('mode', 'upgrade')
    .order('created_at', { ascending: false })
    .limit(1)

  if (findErr) {
    const msg = findErr.message ?? ''
    if (isMissingTableError(msg, findErr.code)) {
      return {
        ok: false,
        code: 'TABLE_MISSING',
        message:
          'Checkout database is not set up yet. Please contact hi@thebeetamin.com and we will enable payments for your account.',
      }
    }
    console.error('[reserveUpgradePurchase] find pending', findErr)
  }

  const pending = pendingRows?.[0]
  if (pending?.id && pending?.txnid) {
    return { ok: true, id: String(pending.id), txnid: String(pending.txnid) }
  }

  const baseRow = {
    user_id: userId,
    plan: 'full',
    amount: Math.round(amountRupees),
    payment_id: null as string | null,
    status: 'pending',
    mode: 'upgrade',
  }

  const attempts: Array<Record<string, unknown>> = [
    { ...baseRow, sessions_total: 6, sessions_used: 0 },
    { ...baseRow },
  ]

  let lastMessage = 'Unknown error'
  for (let attempt = 0; attempt < 3; attempt++) {
    const txnid = makePayUTxnId()
    const row = { ...attempts[Math.min(attempt, attempts.length - 1)], txnid }

    const { data, error } = await supabaseAdmin
      .from('purchases')
      .insert(row)
      .select('id, txnid')
      .single()

    if (!error && data?.id) {
      return {
        ok: true,
        id: String(data.id),
        txnid: String(data.txnid ?? txnid),
      }
    }

    if (!error) break

    lastMessage = error.message ?? lastMessage
    console.error('[reserveUpgradePurchase] insert', {
      attempt,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })

    if (isMissingTableError(lastMessage, error.code)) {
      return { ok: false, code: 'TABLE_MISSING', message: lastMessage }
    }

    if (isMissingColumnError(lastMessage, error.code) && attempt === 0) {
      continue
    }

    if (error.code === '23505') {
      continue
    }

    break
  }

  return {
    ok: false,
    code: 'INSERT_FAILED',
    message: lastMessage,
    detail: 'Could not reserve your checkout. Please try again in a moment or contact hi@thebeetamin.com.',
  }
}
