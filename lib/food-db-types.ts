/** Row shape for public.foods (food DB). */
export type FoodRow = {
  id: string
  name: string
  category: string | null
  default_unit: string | null
  default_qty_grams: number | null
  kcal_per_100g: number | null
  carbs_g_per_100g: number | null
  protein_g_per_100g: number | null
  fat_g_per_100g: number | null
  fiber_g_per_100g: number | null
  tags: string[] | null
  source: 'ifct' | 'custom' | 'prepared'
  is_verified: boolean
  created_by: string | null
  created_at: string
}

export type CreateCustomFoodInput = {
  name: string
  category?: string
  default_unit?: string
  default_qty_grams?: number
  kcal_per_100g?: number
  carbs_g_per_100g?: number
  protein_g_per_100g?: number
  fat_g_per_100g?: number
  fiber_g_per_100g?: number
}

/** Convert per-serving macro values (for default_qty_grams) into DB per-100g columns. */
export function servingMacroToPer100g(
  valuePerServing: number | undefined,
  servingGrams: number,
): number | undefined {
  if (valuePerServing === undefined || valuePerServing === null || Number.isNaN(valuePerServing)) {
    return undefined
  }
  if (servingGrams <= 0) return valuePerServing
  return (valuePerServing * 100) / servingGrams
}

/** Kcal for a food row at a given gram quantity (matches DB meal_plan_entries trigger). */
export function foodKcalAtQty(
  food: Pick<FoodRow, 'kcal_per_100g'>,
  qtyGrams: number,
): number {
  const kcal100 = food.kcal_per_100g
  if (kcal100 == null || Number.isNaN(kcal100) || qtyGrams <= 0) return 0
  return Math.round((kcal100 * qtyGrams) / 100)
}

/** Dropdown options for custom food default serving unit. */
export const FOOD_UNIT_OPTIONS = [
  { value: 'gm', label: 'gm' },
  { value: 'cup', label: 'cup' },
  { value: 'glass', label: 'glass' },
  { value: 'katori bowl', label: 'katori bowl' },
] as const

/** Display label: kcal per default serving or per 100g. */
export function formatFoodKcalLabel(food: Pick<FoodRow, 'kcal_per_100g' | 'default_qty_grams' | 'default_unit'>): string {
  const kcal100 = food.kcal_per_100g
  if (kcal100 == null || Number.isNaN(kcal100)) return '— kcal'

  const qty = food.default_qty_grams
  if (qty != null && qty > 0) {
    const kcal = Math.round((kcal100 * qty) / 100)
    const unit = food.default_unit?.trim().toLowerCase()
    if (!unit || unit === 'g' || unit === 'gm') return `${kcal} kcal · ${Math.round(qty)}g`
    if (unit === 'serving') return `${kcal} kcal · ${Math.round(qty)}g serving`
    return `${kcal} kcal · ${Math.round(qty)} ${food.default_unit?.trim()}`
  }

  return `${Math.round(kcal100)} kcal · 100g`
}

/** Short badge for food search rows — avoids duplicate "Prepared Meal · Prepared meal". */
export function formatFoodSourceBadge(food: Pick<FoodRow, 'source' | 'tags'>): string {
  if (food.source === 'prepared' || food.tags?.includes('prepared_meal')) return 'Prepared meal'
  if (food.source === 'ifct') return 'IFCT ingredient'
  return 'Custom food'
}

export function formatFoodMetaLine(food: Pick<FoodRow, 'category' | 'source' | 'tags'>): string {
  const badge = formatFoodSourceBadge(food)
  const category = food.category?.trim()
  if (!category) return badge
  if (category.toLowerCase() === badge.toLowerCase()) return badge
  if (category.toLowerCase() === 'prepared meal' && badge === 'Prepared meal') return badge
  return `${category} · ${badge}`
}

export const FOOD_CATEGORY_SUGGESTIONS = [
  'Cereal',
  'Pulse',
  'Vegetable',
  'Fruit',
  'Dairy',
  'Meat',
  'Fish',
  'Nut',
  'Oil',
  'Beverage',
  'Snack',
  'Mixed dish',
] as const
