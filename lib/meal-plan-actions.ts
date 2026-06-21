'use server'

import { Resend } from 'resend'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isNutritionistEmail } from '@/lib/nutritionist-config'
import { getOrCreateNutritionist } from '@/lib/nutritionist-actions'
import { verifySignedCookie } from '@/lib/nut-session-crypto-node'
import { emptyDay, nextIsoDate, todayIsoDate } from '@/lib/meal-plan-types'
import type { MealPlan, MealPlanCustomerDTO, MealPlanDay, MealPlanListItem } from '@/lib/meal-plan-types'

// ─── Auth helper (mirrors nutritionist-portal-actions) ─────────────────────────

async function portalNutritionist() {
  const { userId } = await auth()
  if (userId) {
    try {
      return await getOrCreateNutritionist()
    } catch {
      return null
    }
  }
  const cookieStore = await cookies()
  const token = cookieStore.get('nut-session')?.value
  const secret = process.env.COOKIE_SECRET
  if (!token || !secret) return null
  const rawEmail = verifySignedCookie(token, secret)
  const email = rawEmail?.toLowerCase().trim() ?? ''
  if (!email || !isNutritionistEmail(email)) return null
  const { data } = await supabaseAdmin.from('nutritionists').select('*').eq('email', email).maybeSingle()
  return data ?? null
}

// ─── Create ────────────────────────────────────────────────────────────────────

export async function createMealPlan(input: {
  clientId: string
  clientEmail: string
  title: string
  numDays: number
}): Promise<{ ok: true; plan: MealPlan } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const numDays = Math.min(Math.max(input.numDays, 1), 31)
  const days: MealPlanDay[] = []
  let iso = todayIsoDate()
  for (let i = 1; i <= numDays; i++) {
    days.push(emptyDay(i, iso))
    iso = nextIsoDate(iso)
  }

  const { data, error } = await supabaseAdmin
    .from('meal_plans')
    .insert({
      client_id: input.clientId,
      nutritionist_id: nut.id,
      client_email: input.clientEmail,
      title: input.title.trim() || 'My Personalised Meal Plan',
      status: 'draft',
      days,
    })
    .select('*')
    .single()

  if (error || !data) {
    console.error('[createMealPlan]', error)
    return { ok: false, error: error?.message ?? 'Failed to create plan' }
  }
  return { ok: true, plan: data as MealPlan }
}

// ─── Update (save draft) ───────────────────────────────────────────────────────

export async function updateMealPlan(input: {
  planId: string
  title?: string
  nutritionist_notes?: string
  days?: MealPlanDay[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title !== undefined) updates.title = input.title.trim() || 'My Personalised Meal Plan'
  if (input.nutritionist_notes !== undefined) updates.nutritionist_notes = input.nutritionist_notes
  if (input.days !== undefined) updates.days = input.days

  const { error } = await supabaseAdmin
    .from('meal_plans')
    .update(updates)
    .eq('id', input.planId)
    .eq('nutritionist_id', nut.id)

  if (error) {
    console.error('[updateMealPlan]', error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

// ─── Publish ───────────────────────────────────────────────────────────────────

export async function publishMealPlan(input: {
  planId: string
  clientName: string
  clientEmail: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabaseAdmin
    .from('meal_plans')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.planId)
    .eq('nutritionist_id', nut.id)

  if (error) {
    console.error('[publishMealPlan]', error)
    return { ok: false, error: error.message }
  }

  // Send email notification
  await sendMealPlanReadyEmail({
    to: input.clientEmail,
    name: input.clientName,
    nutritionistName: nut.name,
    sessionsUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.thebeetamin.com'}/sessions`,
  }).catch((e) => console.error('[publishMealPlan] email error', e))

  revalidatePath(`/nutritionist/clients/${input.planId}`)
  return { ok: true }
}

// ─── Delete ────────────────────────────────────────────────────────────────────

export async function duplicateMealPlan(input: {
  planId: string
  title?: string
}): Promise<{ ok: true; plan: MealPlan } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const { data: source, error: fetchErr } = await supabaseAdmin
    .from('meal_plans')
    .select('*')
    .eq('id', input.planId)
    .eq('nutritionist_id', nut.id)
    .single()

  if (fetchErr || !source) {
    return { ok: false, error: fetchErr?.message ?? 'Plan not found' }
  }

  const title =
    input.title?.trim() ||
    `${String(source.title).replace(/^Template:\s*/i, '')} (Template)`

  const { data, error } = await supabaseAdmin
    .from('meal_plans')
    .insert({
      client_id: source.client_id,
      nutritionist_id: nut.id,
      client_email: source.client_email,
      title: title.startsWith('Template:') ? title : `Template: ${title}`,
      nutritionist_notes: source.nutritionist_notes,
      status: 'draft',
      days: source.days,
    })
    .select('*')
    .single()

  if (error || !data) {
    console.error('[duplicateMealPlan]', error)
    return { ok: false, error: error?.message ?? 'Failed to create template' }
  }
  return { ok: true, plan: data as MealPlan }
}

export async function deleteMealPlan(planId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabaseAdmin
    .from('meal_plans')
    .delete()
    .eq('id', planId)
    .eq('nutritionist_id', nut.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// ─── List for nutritionist ─────────────────────────────────────────────────────

export async function listMealPlansForClient(
  clientId: string,
): Promise<{ ok: true; plans: MealPlanListItem[] } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const { data, error } = await supabaseAdmin
    .from('meal_plans')
    .select('id, title, status, published_at, created_at, days')
    .eq('client_id', clientId)
    .eq('nutritionist_id', nut.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  if (error) return { ok: false, error: error.message }

  const plans: MealPlanListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    num_days: Array.isArray(row.days) ? (row.days as unknown[]).length : 0,
  }))

  return { ok: true, plans }
}

// ─── Get single plan (for editing) ────────────────────────────────────────────

export async function getMealPlan(
  planId: string,
): Promise<{ ok: true; plan: MealPlan } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const { data, error } = await supabaseAdmin
    .from('meal_plans')
    .select('*')
    .eq('id', planId)
    .eq('nutritionist_id', nut.id)
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Plan not found' }
  return { ok: true, plan: data as MealPlan }
}

// ─── Client-facing fetch (published only) ─────────────────────────────────────

export async function getClientMealPlans(
  clientEmail: string,
): Promise<MealPlanCustomerDTO[]> {
  const { data } = await supabaseAdmin
    .from('meal_plans')
    .select('id, title, nutritionist_notes, days, published_at, nutritionist_id')
    .eq('client_email', clientEmail)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (!data) return []

  const nutIds = [...new Set(data.map((r) => r.nutritionist_id as string))]
  const { data: nuts } = await supabaseAdmin
    .from('nutritionists')
    .select('id, name')
    .in('id', nutIds)

  const nutMap: Record<string, string> = {}
  for (const n of nuts ?? []) {
    nutMap[n.id] = n.name
  }

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    nutritionist_notes: row.nutritionist_notes,
    days: (row.days ?? []) as MealPlanCustomerDTO['days'],
    published_at: row.published_at,
    nutritionist_name: nutMap[row.nutritionist_id as string] ?? null,
  }))
}

// ─── Email notification ────────────────────────────────────────────────────────

async function sendMealPlanReadyEmail(input: {
  to: string
  name: string
  nutritionistName: string
  sessionsUrl: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const from =
    process.env.RESEND_REPORTS_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    'The Beetamin <hi@thebeetamin.com>'
  const firstName = input.name.split(/\s+/)[0] || input.name
  const resend = new Resend(apiKey)

  await resend.emails.send({
    from,
    to: input.to,
    replyTo: process.env.RESEND_SUPPORT_EMAIL || 'support@thebeetamin.com',
    subject: '🥗 Your Personalised Meal Plan is Ready — The Beetamin',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;background:#f4f6f4;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8e0;">
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;border-bottom:3px solid #10B981;">
              <p style="margin:0;font-size:18px;font-weight:bold;color:#10B981;letter-spacing:0.02em;">The Beetamin</p>
              <p style="margin:8px 0 0;font-size:11px;color:#64748b;">Personalised Nutrition</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;">Hi ${firstName},</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                Great news! Your nutritionist <strong>${input.nutritionistName}</strong> has created your personalised meal plan with day-by-day meals tailored specifically for you. 🎉
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;">
                Your plan includes morning routines, breakfast, lunch, snacks, and dinner suggestions — all based on your deficiency report and lifestyle. View it right now on your sessions dashboard.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="background:#10B981;border-radius:8px;text-align:center;">
                    <a href="${input.sessionsUrl}" style="display:inline-block;padding:14px 28px;color:#000000;font-weight:bold;font-size:14px;text-decoration:none;">
                      View My Meal Plan →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                Bring any questions to your next session with ${input.nutritionistName}.
              </p>
              <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#334155;">
                Warm wishes,<br/><span style="color:#10B981;font-weight:bold;">The Beetamin team</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f8faf8;font-size:11px;color:#64748b;text-align:center;border-top:1px solid #e2e8e0;">
              <a href="https://thebeetamin.com" style="color:#10B981;">thebeetamin.com</a>
              · Reply to this email if you need any help
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}
