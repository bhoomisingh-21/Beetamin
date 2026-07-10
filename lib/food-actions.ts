'use server'

import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { isNutritionistEmail } from '@/lib/nutritionist-config'
import type { CreateCustomFoodInput, FoodRow } from '@/lib/food-db-types'
import { getOrCreateNutritionist } from '@/lib/nutritionist-actions'
import { verifySignedCookie } from '@/lib/nut-session-crypto-node'
import { supabaseAdmin } from '@/lib/supabase-admin'

const FOOD_SELECT =
  'id, name, category, default_unit, default_qty_grams, kcal_per_100g, carbs_g_per_100g, protein_g_per_100g, fat_g_per_100g, fiber_g_per_100g, tags, source, is_verified, created_by, created_at'

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

function sanitizeSearchTerm(term: string): string {
  return term.replace(/[%_,]/g, ' ').replace(/\s+/g, ' ').trim()
}

function toNullableNumber(value: number | undefined): number | null {
  if (value === undefined || value === null || Number.isNaN(value)) return null
  return value
}

export async function searchFoods(
  query: string,
): Promise<{ ok: true; foods: FoodRow[] } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const term = sanitizeSearchTerm(query)
  if (term.length < 1) {
    return { ok: true, foods: [] }
  }

  const { data, error } = await supabaseAdmin
    .from('foods')
    .select(FOOD_SELECT)
    .or(`source.eq.ifct,created_by.eq.${nut.id}`)
    .ilike('name', `%${term}%`)
    .order('name', { ascending: true })
    .limit(20)

  if (error) {
    console.error('[searchFoods]', error)
    return { ok: false, error: error.message }
  }

  return { ok: true, foods: (data ?? []) as FoodRow[] }
}

export async function createCustomFood(
  input: CreateCustomFoodInput,
): Promise<{ ok: true; food: FoodRow } | { ok: false; error: string }> {
  const nut = await portalNutritionist()
  if (!nut) return { ok: false, error: 'Not authenticated' }

  const name = input.name.trim()
  if (!name) return { ok: false, error: 'Food name is required' }

  const defaultQty = toNullableNumber(input.default_qty_grams)
  if (defaultQty != null && defaultQty <= 0) {
    return { ok: false, error: 'Default quantity must be greater than 0' }
  }

  const { data, error } = await supabaseAdmin
    .from('foods')
    .insert({
      name,
      category: input.category?.trim() || null,
      default_unit: input.default_unit?.trim() || null,
      default_qty_grams: defaultQty,
      kcal_per_100g: toNullableNumber(input.kcal_per_100g),
      carbs_g_per_100g: toNullableNumber(input.carbs_g_per_100g),
      protein_g_per_100g: toNullableNumber(input.protein_g_per_100g),
      fat_g_per_100g: toNullableNumber(input.fat_g_per_100g),
      fiber_g_per_100g: toNullableNumber(input.fiber_g_per_100g),
      source: 'custom',
      is_verified: false,
      created_by: nut.id,
    })
    .select(FOOD_SELECT)
    .single()

  if (error || !data) {
    console.error('[createCustomFood]', error)
    return { ok: false, error: error?.message ?? 'Failed to create food' }
  }

  return { ok: true, food: data as FoodRow }
}
