import { REFERRAL_REWARD_INR } from '@/lib/referral-constants'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Call after an appointment is marked `completed`. Credits referrer ₹300 when this is the referred
 * client's first completed session ever.
 *
 * Plain server helper (not `'use server'`) so API routes and booking-actions do not pull Resend at module scope.
 */
export async function triggerReferralReward(completedAppointmentId: string, clientId: string): Promise<void> {
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('id, name, email, referred_by, wallet_balance')
    .eq('id', clientId)
    .maybeSingle()

  if (!client?.referred_by || !String(client.referred_by).trim()) return

  const { count: completedCount } = await supabaseAdmin
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('status', 'completed')

  if ((completedCount ?? 0) !== 1) return

  const refCode = String(client.referred_by).trim().toUpperCase()

  const { data: referrer } = await supabaseAdmin
    .from('clients')
    .select('id, name, email, wallet_balance, successful_referrals')
    .eq('referral_code', refCode)
    .maybeSingle()

  if (!referrer?.id || referrer.id === clientId) return

  const { data: existingReward } = await supabaseAdmin
    .from('referral_rewards')
    .select('id')
    .eq('referrer_id', referrer.id)
    .eq('referred_user_id', clientId)
    .maybeSingle()

  if (existingReward) return

  const REWARD_AMOUNT = REFERRAL_REWARD_INR
  const prevBal = referrer.wallet_balance ?? 0
  const newBalance = prevBal + REWARD_AMOUNT
  const nextSuccess = (referrer.successful_referrals ?? 0) + 1

  const { error: insRw } = await supabaseAdmin.from('referral_rewards').insert({
    referrer_id: referrer.id,
    referred_user_id: clientId,
    session_id: completedAppointmentId,
    amount: REWARD_AMOUNT,
    status: 'credited',
  })
  if (insRw) {
    console.error('[triggerReferralReward] insert referral_rewards', insRw)
    return
  }

  const { error: upRef } = await supabaseAdmin
    .from('clients')
    .update({
      wallet_balance: newBalance,
      successful_referrals: nextSuccess,
    })
    .eq('id', referrer.id)

  if (upRef) {
    console.error('[triggerReferralReward] update referrer wallet', upRef)
    return
  }

  await supabaseAdmin.from('wallet_transactions').insert({
    user_id: referrer.id,
    amount: REWARD_AMOUNT,
    type: 'referral_credit',
    description: `Referral reward — ${client.name ?? 'Friend'} completed their first session`,
  })

  const fromEmail = process.env.RESEND_FROM_EMAIL
  const toEmail = referrer.email?.trim()
  const apiKey = process.env.RESEND_API_KEY
  if (!fromEmail || !toEmail || !apiKey) return

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `You earned ₹${REWARD_AMOUNT}! ${client.name ?? 'Your friend'} completed their first session 🎉`,
      html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0F14;color:white;padding:40px;border-radius:16px;">
        <h1 style="color:#10B981;">You earned ₹${REWARD_AMOUNT}! 🎉</h1>
        <p style="color:#9CA3AF;">Your friend <strong style="color:white">${client.name ?? 'Someone'}</strong> just completed their first nutrition session.</p>
        <div style="background:#111820;border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:white;margin:0;">💰 Amount credited: <strong>₹${REWARD_AMOUNT}</strong></p>
          <p style="color:white;margin:8px 0;">👛 New wallet balance: <strong>₹${newBalance}</strong></p>
        </div>
        <p style="color:#9CA3AF;">Use your wallet balance on your next TheBeetamin purchase at checkout.</p>
        <a href="https://thebeetamin.com/dashboard/referral"
           style="background:#10B981;color:black;padding:16px 32px;border-radius:50px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:16px;">
          View My Wallet →
        </a>
        <p style="color:#6B7280;font-size:12px;margin-top:32px;">Keep sharing! Every successful referral earns you ₹${REWARD_AMOUNT}.</p>
      </div>
    `,
    })
  } catch (e) {
    console.error('[triggerReferralReward] Resend failed:', e)
  }
}
