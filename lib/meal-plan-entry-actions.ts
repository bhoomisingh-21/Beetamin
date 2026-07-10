'use server'

import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { isNutritionistEmail } from '@/lib/nutritionist-config'
import { normalizeMealPlanEntry, type MealPlanEntryDbRow, type MealPlanEntryRow } from '@/lib/meal-plan-entry-types'
import { getOrCreateNutritionist } from '@/lib/nutritionist-actions'
import { verifySignedCookie } from '@/lib/nut-session-crypto-node'
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
