'use server'

import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isNutritionistEmail } from '@/lib/nutritionist-config'
import { getOrCreateNutritionist } from '@/lib/nutritionist-actions'
import { verifySignedCookie } from '@/lib/nut-session-crypto-node'
import { sendNutritionistDietPlanEmail } from '@/lib/send-diet-plan-email'
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

  const { data: planRow, error: fetchErr } = await supabaseAdmin
    .from('meal_plans')
    .select('title, client_email')
    .eq('id', input.planId)
    .eq('nutritionist_id', nut.id)
    .single()

  if (fetchErr || !planRow) {
    return { ok: false, error: fetchErr?.message ?? 'Plan not found' }
  }

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

  const emailTo = input.clientEmail || String(planRow.client_email || '')
  if (emailTo && !emailTo.endsWith('@beetamin.internal')) {
    const emailRes = await sendNutritionistDietPlanEmail({
      to: emailTo,
      name: input.clientName,
      nutritionistName: nut.name,
      planTitle: String(planRow.title || 'Personalised Diet Plan'),
    })
    if (!emailRes.ok) {
      console.error('[publishMealPlan] email', emailRes.error)
    }
  }

  revalidatePath('/sessions')
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
