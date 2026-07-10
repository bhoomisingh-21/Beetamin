export type FoodJoinRow = { name: string; category: string | null }

export type MealPlanEntryRow = {
  id: string
  meal_plan_id: string
  entry_date: string
  meal_slot: string
  food_id: string | null
  recipe_id: string | null
  qty_grams: number
  kcal: number | null
  carbs_g: number | null
  protein_g: number | null
  fat_g: number | null
  created_at: string
  updated_at: string
  foods: FoodJoinRow | null
}

/** Supabase may return `foods` as object or array depending on code-gen. */
export type MealPlanEntryDbRow = Omit<MealPlanEntryRow, 'foods'> & {
  foods: FoodJoinRow | FoodJoinRow[] | null
}

export function normalizeMealPlanEntry(row: MealPlanEntryDbRow): MealPlanEntryRow {
  const { foods, ...rest } = row
  let normalizedFood: FoodJoinRow | null = null
  if (foods) {
    normalizedFood = Array.isArray(foods) ? (foods[0] ?? null) : foods
  }
  return { ...rest, foods: normalizedFood }
}

export type DayMacroTotals = {
  kcal: number
  carbs: number
  protein: number
  fat: number
}

export function emptyDayTotals(): DayMacroTotals {
  return { kcal: 0, carbs: 0, protein: 0, fat: 0 }
}

export function sumDayTotals(entries: MealPlanEntryRow[]): DayMacroTotals {
  return entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + (e.kcal ?? 0),
      carbs: acc.carbs + (e.carbs_g ?? 0),
      protein: acc.protein + (e.protein_g ?? 0),
      fat: acc.fat + (e.fat_g ?? 0),
    }),
    emptyDayTotals(),
  )
}

export function entryCellKey(entryDate: string, mealSlot: string): string {
  return `${entryDate}|${mealSlot}`
}
