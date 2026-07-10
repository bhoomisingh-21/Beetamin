'use server'

import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { isNutritionistEmail } from '@/lib/nutritionist-config'
import { normalizeMealPlanEntry, type MealPlanEntryDbRow, type MealPlanEntryRow } from '@/lib/meal-plan-entry-types'
import { getOrCreateNutritionist } from '@/lib/nutritionist-actions'
import { verifySignedCookie } from '@/lib/nut-session-crypto-node'
import { MEAL_SLOT_QUICK_FOODS } from '@/lib/meal-slot-suggestions'
import type { MealSlots } from '@/lib/meal-plan-types'
import { supabaseAdmin } from '@/lib/supabase-admin'

const ENTRY_SELECT =
  'id, meal_plan_id, entry_date, meal_slot, food_id, recipe_id, qty_grams, kcal, carbs_g, protein_g, fat_g, created_at, updated_at, foods(name, category)'

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

async function assertOwnsMealPlan(mealPlanId: string, nutritionistId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('meal_plans')
    .select('id')
    .eq('id', mealPlanId)
    .eq('nutritionist_id', nutritionistId)
    .maybeSingle()
  return !!data
}

export async function listMealPlanEntries(
  mealPlanId: string,
): Promise<{ ok: true; entries: MealPlanEntryRow[] } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }
  if (!(await assertOwnsMealPlan(mealPlanId, nut.id))) {
    return { ok: false, error: 'Meal plan not found' }
  }

  const { data, error } = await supabaseAdmin
    .from('meal_plan_entries')
    .select(ENTRY_SELECT)
    .eq('meal_plan_id', mealPlanId)
    .order('entry_date', { ascending: true })

  if (error) {
    console.error('[listMealPlanEntries]', error)
    return { ok: false, error: error.message }
  }

  return {
    ok: true,
    entries: (data ?? []).map((row) => normalizeMealPlanEntry(row as MealPlanEntryDbRow)),
  }
}

export async function addMealPlanFoodEntry(input: {
  mealPlanId: string
  entryDate: string
  mealSlot: string
  foodId: string
  qtyGrams: number
}): Promise<{ ok: true; entry: MealPlanEntryRow } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }
  if (!(await assertOwnsMealPlan(input.mealPlanId, nut.id))) {
    return { ok: false, error: 'Meal plan not found' }
  }

  const qty = Math.round(input.qtyGrams * 100) / 100
  if (qty <= 0) return { ok: false, error: 'Quantity must be greater than 0' }

  const { data, error } = await supabaseAdmin
    .from('meal_plan_entries')
    .insert({
      meal_plan_id: input.mealPlanId,
      entry_date: input.entryDate,
      meal_slot: input.mealSlot,
      food_id: input.foodId,
      qty_grams: qty,
    })
    .select(ENTRY_SELECT)
    .single()

  if (error || !data) {
    console.error('[addMealPlanFoodEntry]', error)
    return { ok: false, error: error?.message ?? 'Failed to add food' }
  }

  revalidatePath('/nutritionist')
  return { ok: true, entry: normalizeMealPlanEntry(data as MealPlanEntryDbRow) }
}

export async function updateMealPlanEntryQty(input: {
  entryId: string
  mealPlanId: string
  qtyGrams: number
}): Promise<{ ok: true; entry: MealPlanEntryRow } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }
  if (!(await assertOwnsMealPlan(input.mealPlanId, nut.id))) {
    return { ok: false, error: 'Meal plan not found' }
  }

  const qty = Math.round(input.qtyGrams * 100) / 100
  if (qty <= 0) return { ok: false, error: 'Quantity must be greater than 0' }

  const { data, error } = await supabaseAdmin
    .from('meal_plan_entries')
    .update({ qty_grams: qty })
    .eq('id', input.entryId)
    .eq('meal_plan_id', input.mealPlanId)
    .select(ENTRY_SELECT)
    .single()

  if (error || !data) {
    console.error('[updateMealPlanEntryQty]', error)
    return { ok: false, error: error?.message ?? 'Failed to update' }
  }

  return { ok: true, entry: normalizeMealPlanEntry(data as MealPlanEntryDbRow) }
}

export async function deleteMealPlanEntry(input: {
  entryId: string
  mealPlanId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }
  if (!(await assertOwnsMealPlan(input.mealPlanId, nut.id))) {
    return { ok: false, error: 'Meal plan not found' }
  }

  const { error } = await supabaseAdmin
    .from('meal_plan_entries')
    .delete()
    .eq('id', input.entryId)
    .eq('meal_plan_id', input.mealPlanId)

  if (error) {
    console.error('[deleteMealPlanEntry]', error)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

function sanitizeSearchTerm(term: string): string {
  return term.replace(/[%_,]/g, ' ').replace(/\s+/g, ' ').trim()
}

async function findFoodForTerm(term: string, nutritionistId: string) {
  const q = sanitizeSearchTerm(term)
  if (!q) return null
  const { data } = await supabaseAdmin
    .from('foods')
    .select('id')
    .or(`source.eq.ifct,created_by.eq.${nutritionistId}`)
    .ilike('name', `%${q}%`)
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

export async function seedDefaultMealPlanEntries(input: {
  mealPlanId: string
  cells: { entryDate: string; mealSlot: keyof MealSlots; label: string }[]
}): Promise<{ ok: true; added: number } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }
  if (!(await assertOwnsMealPlan(input.mealPlanId, nut.id))) {
    return { ok: false, error: 'Meal plan not found' }
  }

  const { data: existing, error: listErr } = await supabaseAdmin
    .from('meal_plan_entries')
    .select('entry_date, meal_slot')
    .eq('meal_plan_id', input.mealPlanId)

  if (listErr) {
    console.error('[seedDefaultMealPlanEntries]', listErr)
    return { ok: false, error: listErr.message }
  }

  const occupied = new Set(
    (existing ?? []).map((e) => `${e.entry_date}|${e.meal_slot}`),
  )

  let added = 0
  for (const cell of input.cells) {
    const key = `${cell.entryDate}|${cell.mealSlot}`
    if (occupied.has(key)) continue

    const picks = MEAL_SLOT_QUICK_FOODS[cell.mealSlot]
    const pick =
      picks.find((p) => p.label.toLowerCase() === cell.label.trim().toLowerCase()) ?? picks[0]
    if (!pick) continue

    const foodId = await findFoodForTerm(pick.searchTerm, nut.id)
    if (!foodId) continue

    const { error } = await supabaseAdmin.from('meal_plan_entries').insert({
      meal_plan_id: input.mealPlanId,
      entry_date: cell.entryDate,
      meal_slot: cell.mealSlot,
      food_id: foodId,
      qty_grams: pick.defaultGrams,
    })
    if (!error) {
      occupied.add(key)
      added += 1
    }
  }

  if (added > 0) revalidatePath('/nutritionist')
  return { ok: true, added }
}
