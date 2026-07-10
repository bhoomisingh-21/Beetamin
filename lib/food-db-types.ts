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
  source: 'ifct' | 'custom'
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

/** Display label: kcal per default serving or per 100g. */
export function formatFoodKcalLabel(food: Pick<FoodRow, 'kcal_per_100g' | 'default_qty_grams' | 'default_unit'>): string {
  const kcal100 = food.kcal_per_100g
  if (kcal100 == null || Number.isNaN(kcal100)) return '— kcal'

  const qty = food.default_qty_grams
  if (qty != null && qty > 0) {
    const kcal = Math.round((kcal100 * qty) / 100)
    const unit = food.default_unit?.trim()
    const qtyLabel = unit && unit !== 'g' ? `${qty}${unit}` : `${qty}g`
    return `${kcal} kcal / ${qtyLabel}`
  }

  return `${kcal100} kcal / 100g`
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
