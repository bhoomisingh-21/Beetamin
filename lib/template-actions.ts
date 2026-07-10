'use server'

import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { isNutritionistEmail } from '@/lib/nutritionist-config'
import { getOrCreateNutritionist } from '@/lib/nutritionist-actions'
import { verifySignedCookie } from '@/lib/nut-session-crypto-node'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const TEMPLATE_CONDITION_TAGS = [
  'PCOD',
  'weight_loss',
  'weight_gain',
  'diabetes',
  'thyroid',
  'PCOS',
  'general',
] as const

export type TemplateListItem = {
  id: string
  name: string
  condition_tags: string[]
  target_kcal: number | null
  created_at: string
  entry_count: number
}

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

export async function listNutritionistTemplates(): Promise<
  { ok: true; templates: TemplateListItem[] } | { ok: false; error: string }
> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const { data, error } = await supabaseAdmin
    .from('templates')
    .select('id, name, condition_tags, target_kcal, created_at, template_entries(count)')
    .eq('created_by', nut.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[listNutritionistTemplates]', error)
    return { ok: false, error: error.message }
  }

  const templates: TemplateListItem[] = (data ?? []).map((row) => {
    const r = row as {
      id: string
      name: string
      condition_tags: string[]
      target_kcal: number | null
      created_at: string
      template_entries: { count: number }[] | { count: number } | null
    }
    const countRaw = r.template_entries
    const entry_count = Array.isArray(countRaw)
      ? (countRaw[0]?.count ?? 0)
      : (countRaw as { count: number } | null)?.count ?? 0
    return {
      id: r.id,
      name: r.name,
      condition_tags: r.condition_tags ?? [],
      target_kcal: r.target_kcal,
      created_at: r.created_at,
      entry_count,
    }
  })

  return { ok: true, templates }
}

export async function deleteNutritionistTemplate(
  templateId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabaseAdmin
    .from('templates')
    .delete()
    .eq('id', templateId)
    .eq('created_by', nut.id)

  if (error) {
    console.error('[deleteNutritionistTemplate]', error)
    return { ok: false, error: error.message }
  }

  revalidatePath('/nutritionist/templates')
  return { ok: true }
}

export async function saveMealPlanAsTemplate(input: {
  mealPlanId: string
  name: string
  conditionTags: string[]
  targetKcal?: number
}): Promise<{ ok: true; templateId: string } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const name = input.name.trim()
  if (!name) return { ok: false, error: 'Template name is required' }

  const { data: plan } = await supabaseAdmin
    .from('meal_plans')
    .select('id, start_date, target_kcal')
    .eq('id', input.mealPlanId)
    .eq('nutritionist_id', nut.id)
    .maybeSingle()

  if (!plan) return { ok: false, error: 'Meal plan not found' }

  const { data: entries } = await supabaseAdmin
    .from('meal_plan_entries')
    .select('entry_date, meal_slot, food_id, recipe_id, qty_grams')
    .eq('meal_plan_id', input.mealPlanId)
    .order('entry_date', { ascending: true })

  if (!entries?.length) {
    return { ok: false, error: 'Add foods to the plan before saving as a template' }
  }

  const startDate = (plan.start_date as string | null) ?? (entries[0].entry_date as string)
  const startMs = new Date(`${startDate}T12:00:00`).getTime()

  const { data: template, error: tErr } = await supabaseAdmin
    .from('templates')
    .insert({
      name,
      condition_tags: input.conditionTags.length ? input.conditionTags : ['general'],
      target_kcal: input.targetKcal ?? (plan.target_kcal as number | null) ?? null,
      created_by: nut.id,
    })
    .select('id')
    .single()

  if (tErr || !template) {
    console.error('[saveMealPlanAsTemplate]', tErr)
    return { ok: false, error: tErr?.message ?? 'Failed to create template' }
  }

  const templateEntries = entries.map((e) => {
    const entryMs = new Date(`${e.entry_date as string}T12:00:00`).getTime()
    const dayNumber = Math.floor((entryMs - startMs) / 86400000) + 1
    return {
      template_id: template.id,
      day_number: Math.max(1, dayNumber),
      meal_slot: e.meal_slot,
      food_id: e.food_id,
      recipe_id: e.recipe_id,
      qty_grams: e.qty_grams,
    }
  })

  const { error: eErr } = await supabaseAdmin.from('template_entries').insert(templateEntries)
  if (eErr) {
    await supabaseAdmin.from('templates').delete().eq('id', template.id)
    console.error('[saveMealPlanAsTemplate entries]', eErr)
    return { ok: false, error: eErr.message }
  }

  revalidatePath('/nutritionist/templates')
  return { ok: true, templateId: template.id as string }
}

export async function applyTemplateToMealPlan(input: {
  templateId: string
  mealPlanId: string
  startDate: string
  scaleFactor?: number
}): Promise<{ ok: true; rowsInserted: number } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const { data: plan } = await supabaseAdmin
    .from('meal_plans')
    .select('id')
    .eq('id', input.mealPlanId)
    .eq('nutritionist_id', nut.id)
    .maybeSingle()

  if (!plan) return { ok: false, error: 'Meal plan not found' }

  const { data: template } = await supabaseAdmin
    .from('templates')
    .select('id')
    .eq('id', input.templateId)
    .eq('created_by', nut.id)
    .maybeSingle()

  if (!template) return { ok: false, error: 'Template not found' }

  const { data, error } = await supabaseAdmin.rpc('apply_template', {
    p_template_id: input.templateId,
    p_meal_plan_id: input.mealPlanId,
    p_start_date: input.startDate,
    p_scale_factor: input.scaleFactor ?? 1,
  })

  if (error) {
    console.error('[applyTemplateToMealPlan]', error)
    return { ok: false, error: error.message }
  }

  await supabaseAdmin
    .from('meal_plans')
    .update({ start_date: input.startDate })
    .eq('id', input.mealPlanId)

  revalidatePath('/nutritionist')
  return { ok: true, rowsInserted: (data as number) ?? 0 }
}
