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
  { value: 'ml', label: 'ml' },
  { value: 'piece', label: 'piece' },
  { value: 'cup', label: 'cup' },
  { value: 'glass', label: 'glass' },
  { value: 'katori bowl', label: 'katori bowl' },
] as const

const GLASS_ML = 200
const CUP_ML = 150
const KATORI_GM = 100
const BOWL_GM = 200

export type FormatFoodQuantityInput = {
  qtyGrams: number
  defaultUnit?: string | null
  defaultServingGrams?: number | null
  foodName?: string
  category?: string | null
}

function roundServingCount(n: number): number {
  const rounded = Math.round(n * 10) / 10
  return rounded % 1 === 0 ? Math.round(rounded) : rounded
}

function normalizeFoodUnit(unit: string | null | undefined): string | null {
  if (!unit?.trim()) return null
  const u = unit.trim().toLowerCase()
  if (u === 'g' || u === 'gram' || u === 'grams' || u === 'gms') return 'gm'
  if (u === 'ml' || u === 'milliliter' || u === 'millilitre') return 'ml'
  if (u === 'cup' || u === 'cups') return 'cup'
  if (u === 'glass' || u === 'glasses') return 'glass'
  if (u === 'piece' || u === 'pieces' || u === 'pc' || u === 'pcs') return 'piece'
  if (u === 'katori' || u.includes('katori')) return 'katori'
  if (u === 'bowl' || u === 'bowls') return 'bowl'
  if (u === 'gm') return 'gm'
  return u
}

function extractPieceCountFromName(name: string): number | null {
  const paren = name.match(
    /\((\d+)\s*(?:halves|pieces|pcs|almonds|eggs|rotis|idli|dosa|chilla|chillas)?\)/i,
  )
  if (paren) return Number(paren[1])
  const inline = name.match(
    /\b(\d+)\s*(?:halves|pieces|pcs|almonds|eggs|chillas?|rotis?|idli|dosas?)\b/i,
  )
  if (inline) return Number(inline[1])
  const trailing = name.match(/\s(\d+)\s*$/)
  if (trailing) {
    const n = Number(trailing[1])
    if (n > 0 && n <= 24) return n
  }
  return null
}

/** Piece count baked into the food name/serving (e.g. "besan chilla 2" → 2). */
export function foodPiecesPerServing(foodName: string): number {
  return extractPieceCountFromName(foodName) ?? 1
}

export function qtyGramsToPieceCount(
  qtyGrams: number,
  servingGrams: number | null | undefined,
  foodName: string,
): number {
  const piecesPerServing = foodPiecesPerServing(foodName)
  if (!servingGrams || servingGrams <= 0) return piecesPerServing
  return roundServingCount((qtyGrams / servingGrams) * piecesPerServing)
}

export function pieceCountToQtyGrams(
  pieceCount: number,
  servingGrams: number | null | undefined,
  foodName: string,
): number {
  const piecesPerServing = foodPiecesPerServing(foodName)
  if (!servingGrams || servingGrams <= 0) return Math.max(1, Math.round(pieceCount))
  return Math.max(1, Math.round((pieceCount / piecesPerServing) * servingGrams))
}

export function formatFoodUnitLabel(unit: string | null | undefined): string {
  const normalized = normalizeFoodUnit(unit)
  if (normalized === 'piece') return 'piece'
  if (normalized === 'ml') return 'ml'
  if (normalized === 'cup') return 'cup'
  if (normalized === 'glass') return 'glass'
  return 'gm'
}

function isLiquidFood(name: string, category: string): boolean {
  if (category.toLowerCase() === 'beverage') return true
  return /\b(water|juice|milk|buttermilk|lassi|smoothie|tea|coffee|drink|shake|chaas|soup)\b/i.test(name)
}

function isNearGlassPortion(qtyGrams: number): boolean {
  const glasses = qtyGrams / GLASS_ML
  const nearest = Math.round(glasses)
  if (nearest <= 0) return false
  return Math.abs(glasses - nearest) < 0.15
}

function inferFoodUnit(name: string, category: string | null, qtyGrams: number): string {
  const n = name.trim()
  const cat = category?.trim() ?? ''

  if (isLiquidFood(n, cat)) {
    return isNearGlassPortion(qtyGrams) ? 'glass' : 'ml'
  }

  if (extractPieceCountFromName(n) != null) return 'piece'
  if (/\((?:medium|large|small)\)/i.test(n) && /\b(apple|banana|orange|mango|pineapple)\b/i.test(n)) {
    return 'piece'
  }

  return 'gm'
}

function resolveDisplayUnit(input: FormatFoodQuantityInput): string {
  const normalized = normalizeFoodUnit(input.defaultUnit)
  if (normalized) return normalized
  return inferFoodUnit(input.foodName ?? '', input.category ?? null, input.qtyGrams)
}

/** Human-readable quantity for meal-plan PDFs (gm, ml, piece, Cup, Glass). */
export function formatFoodQuantityForPdf(input: FormatFoodQuantityInput): string {
  const qty = input.qtyGrams
  if (!Number.isFinite(qty) || qty <= 0) return ''

  const unit = resolveDisplayUnit(input)
  const serving =
    input.defaultServingGrams != null && input.defaultServingGrams > 0 ? input.defaultServingGrams : null

  switch (unit) {
    case 'glass': {
      const count = serving ? qty / serving : qty / GLASS_ML
      return `${roundServingCount(count)} Glass`
    }
    case 'cup': {
      const count = serving ? qty / serving : qty / CUP_ML
      return `${roundServingCount(count)} Cup`
    }
    case 'katori': {
      const count = serving ? qty / serving : qty / KATORI_GM
      return `${roundServingCount(count)} katori`
    }
    case 'bowl': {
      const count = serving ? qty / serving : qty / BOWL_GM
      return `${roundServingCount(count)} bowl`
    }
    case 'ml':
      return `${Math.round(qty)} ml`
    case 'piece': {
      const piecesPerServing = foodPiecesPerServing(input.foodName ?? '')
      if (serving && qty > 0) {
        const count = (qty / serving) * piecesPerServing
        return `${roundServingCount(count)} piece`
      }
      return `${roundServingCount(piecesPerServing)} piece`
    }
    case 'gm':
    default:
      return `${Math.round(qty)} gm`
  }
}

/** Strip trailing quantity hints from food names for PDF display. */
export function stripTrailingQuantityFromFoodName(name: string, defaultUnit?: string | null): string {
  let cleaned = name.replace(/\s*\(\s*\d+(?:\.\d+)?\s*(?:g|gm|gms?|ml)\s*\)\s*$/i, '').trim()
  if (normalizeFoodUnit(defaultUnit) === 'piece' && extractPieceCountFromName(name) != null) {
    cleaned = cleaned.replace(/\s+\d+\s*$/, '').trim()
  }
  return cleaned
}

/** Display label: kcal per default serving or per 100g. */
export function formatFoodKcalLabel(food: Pick<FoodRow, 'kcal_per_100g' | 'default_qty_grams' | 'default_unit'>): string {
  const kcal100 = food.kcal_per_100g
  if (kcal100 == null || Number.isNaN(kcal100)) return '— kcal'

  const qty = food.default_qty_grams
  if (qty != null && qty > 0) {
    const kcal = Math.round((kcal100 * qty) / 100)
    const unit = food.default_unit?.trim().toLowerCase()
    if (!unit || unit === 'g' || unit === 'gm') return `${kcal} kcal · ${Math.round(qty)} gm`
    if (unit === 'serving') return `${kcal} kcal · ${Math.round(qty)} gm serving`
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
