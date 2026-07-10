import type { MealSlots } from '@/lib/meal-plan-types'

export type QuickFoodPick = {
  label: string
  /** Primary IFCT / food name match (most reliable). */
  ifctName?: string
  /** Fallback fuzzy search term. */
  searchTerm: string
  defaultGrams: number
}

/** Fitrofy-style: these rows stay the same all week. */
export const SAME_DAILY_SLOTS: (keyof MealSlots)[] = ['early_morning', 'bedtime']

export const MEAL_SLOT_QUICK_FOODS: Record<keyof MealSlots, QuickFoodPick[]> = {
  early_morning: [
    { label: 'Jeera + saunf water', ifctName: 'Cumin seeds', searchTerm: 'Cumin', defaultGrams: 5 },
    { label: 'Warm water + lemon', ifctName: 'Lemon, juice', searchTerm: 'Lemon', defaultGrams: 50 },
    { label: 'Soaked almonds (5)', ifctName: 'Almond', searchTerm: 'Almond', defaultGrams: 30 },
  ],
  breakfast: [
    { label: 'Idli + sambar', ifctName: 'Rice, raw, milled', searchTerm: 'Rice, raw', defaultGrams: 180 },
    { label: 'Vegetable Poha', ifctName: 'Rice flakes', searchTerm: 'Rice flakes', defaultGrams: 150 },
    { label: 'Methi Paratha', ifctName: 'Wheat flour, atta', searchTerm: 'Wheat flour, atta', defaultGrams: 100 },
    { label: 'Paneer Sandwich', ifctName: 'Paneer', searchTerm: 'Paneer', defaultGrams: 90 },
    { label: 'Egg Omelette', ifctName: 'Egg, poultry, omlet', searchTerm: 'Egg, poultry, omlet', defaultGrams: 120 },
    { label: 'Oats Vegetable Upma', ifctName: 'Wheat, semolina', searchTerm: 'Wheat, semolina', defaultGrams: 150 },
    { label: 'Dosa + sambar', ifctName: 'Rice, parboiled, milled', searchTerm: 'Rice, parboiled', defaultGrams: 180 },
  ],
  mid_morning: [
    { label: 'Barley water', ifctName: 'Barley', searchTerm: 'Barley', defaultGrams: 200 },
    { label: 'Red Apple (medium)', ifctName: 'Apple, big', searchTerm: 'Apple, big', defaultGrams: 150 },
    { label: 'Pineapple', ifctName: 'Pineapple', searchTerm: 'Pineapple', defaultGrams: 150 },
    { label: 'ABC juice', ifctName: 'Beet root', searchTerm: 'Beet root', defaultGrams: 200 },
    { label: 'Roasted chana', ifctName: 'Bengal gram, whole', searchTerm: 'Bengal gram, whole', defaultGrams: 50 },
    { label: 'Buttermilk', ifctName: 'Milk, whole, Cow', searchTerm: 'Milk, whole, Cow', defaultGrams: 200 },
    { label: 'Mango slices', ifctName: 'Mango, ripe, banganapalli', searchTerm: 'Mango, ripe', defaultGrams: 150 },
  ],
  lunch: [
    { label: 'Dal + rice + sabzi', ifctName: 'Rice, raw, milled', searchTerm: 'Rice, raw, milled', defaultGrams: 200 },
    { label: 'Roti + paneer sabzi', ifctName: 'Wheat flour, atta', searchTerm: 'Wheat flour, atta', defaultGrams: 120 },
    { label: 'Khichdi + curd', ifctName: 'Green gram, dal', searchTerm: 'Green gram, dal', defaultGrams: 220 },
    { label: 'Brown rice + rajma', ifctName: 'Rajmah, red', searchTerm: 'Rajmah, red', defaultGrams: 200 },
    { label: 'Roti + dal + sabzi', ifctName: 'Red gram, dal', searchTerm: 'Red gram, dal', defaultGrams: 200 },
    { label: 'Jeera rice + raita', ifctName: 'Rice, parboiled, milled', searchTerm: 'Rice, parboiled', defaultGrams: 200 },
    { label: 'Millet bowl + curd', ifctName: 'Bajra', searchTerm: 'Bajra', defaultGrams: 180 },
  ],
  evening_snack: [
    { label: 'Roasted makhana', ifctName: 'Rice puffed', searchTerm: 'Rice puffed', defaultGrams: 50 },
    { label: 'Sprouts chaat', ifctName: 'Green gram, whole', searchTerm: 'Green gram, whole', defaultGrams: 100 },
    { label: 'Green tea + biscuits', ifctName: 'Wheat flour, refined', searchTerm: 'Wheat flour, refined', defaultGrams: 40 },
    { label: 'Walnut (4 halves)', ifctName: 'Walnut', searchTerm: 'Walnut', defaultGrams: 30 },
    { label: 'Roasted flax seeds', ifctName: 'Linseeds', searchTerm: 'Linseeds', defaultGrams: 15 },
    { label: 'Fruit bowl', ifctName: 'Banana, ripe, montham', searchTerm: 'Banana, ripe', defaultGrams: 120 },
    { label: 'Roasted chana', ifctName: 'Bengal gram, whole', searchTerm: 'Bengal gram, whole', defaultGrams: 50 },
  ],
  dinner: [
    { label: 'Roti + dal + vegetables', ifctName: 'Wheat flour, atta', searchTerm: 'Wheat flour, atta', defaultGrams: 100 },
    { label: 'Grilled chicken + salad', ifctName: 'Chicken, poultry, breast, skinless', searchTerm: 'Chicken, poultry, breast', defaultGrams: 120 },
    { label: 'Vegetable soup + toast', ifctName: 'Tomato, ripe, local', searchTerm: 'Tomato, ripe', defaultGrams: 200 },
    { label: 'Paneer tikka + roti', ifctName: 'Paneer', searchTerm: 'Paneer', defaultGrams: 100 },
    { label: 'Fish curry + rice', ifctName: 'Rohu, fish', searchTerm: 'Rohu', defaultGrams: 150 },
    { label: 'Khichdi + papad', ifctName: 'Rice, raw, milled', searchTerm: 'Rice, raw, milled', defaultGrams: 180 },
    { label: 'Stuffed paratha + curd', ifctName: 'Wheat flour, atta', searchTerm: 'Wheat flour, atta', defaultGrams: 110 },
  ],
  bedtime: [
    { label: 'Turmeric milk', ifctName: 'Milk, whole, Cow', searchTerm: 'Milk, whole, Cow', defaultGrams: 200 },
    { label: 'Soaked walnuts', ifctName: 'Walnut', searchTerm: 'Walnut', defaultGrams: 30 },
    { label: 'Warm milk + honey', ifctName: 'Milk, whole, Buffalo', searchTerm: 'Milk, whole, Buffalo', defaultGrams: 200 },
  ],
}

export const MEAL_SLOT_SUGGESTIONS: Record<keyof MealSlots, string[]> = Object.fromEntries(
  Object.entries(MEAL_SLOT_QUICK_FOODS).map(([k, v]) => [k, v.map((p) => p.label)]),
) as Record<keyof MealSlots, string[]>

export function pickForSlot(slot: keyof MealSlots, dayIndex: number): QuickFoodPick {
  const picks = MEAL_SLOT_QUICK_FOODS[slot]
  if (SAME_DAILY_SLOTS.includes(slot)) return picks[0]
  return picks[((dayIndex % picks.length) + picks.length) % picks.length]
}

export function defaultMealsForDay(dayIndex: number): MealSlots {
  return {
    early_morning: pickForSlot('early_morning', dayIndex).label,
    breakfast: pickForSlot('breakfast', dayIndex).label,
    mid_morning: pickForSlot('mid_morning', dayIndex).label,
    lunch: pickForSlot('lunch', dayIndex).label,
    evening_snack: pickForSlot('evening_snack', dayIndex).label,
    dinner: pickForSlot('dinner', dayIndex).label,
    bedtime: pickForSlot('bedtime', dayIndex).label,
  }
}

export function defaultMealLabelForSlot(slot: keyof MealSlots, dayIndex = 0): string {
  return pickForSlot(slot, dayIndex).label
}

/** @deprecated Use defaultMealsForDay */
export function defaultMealSlots(): MealSlots {
  return defaultMealsForDay(0)
}

export function hydrateMealSlotsForDay(
  meals: Partial<MealSlots> | undefined,
  dayIndex: number,
): MealSlots {
  const dayDefaults = defaultMealsForDay(dayIndex)
  const src = meals ?? {}
  return {
    early_morning: src.early_morning?.trim() || dayDefaults.early_morning,
    breakfast: src.breakfast?.trim() || dayDefaults.breakfast,
    mid_morning: src.mid_morning?.trim() || dayDefaults.mid_morning,
    lunch: src.lunch?.trim() || dayDefaults.lunch,
    evening_snack: src.evening_snack?.trim() || dayDefaults.evening_snack,
    dinner: src.dinner?.trim() || dayDefaults.dinner,
    bedtime: src.bedtime?.trim() || dayDefaults.bedtime,
  }
}

/** @deprecated Use hydrateMealSlotsForDay */
export function hydrateMealSlots(meals: Partial<MealSlots> | undefined): MealSlots {
  return hydrateMealSlotsForDay(meals, 0)
}

export function isUniformMealWeek(days: { meals: MealSlots }[]): boolean {
  if (days.length < 2) return false
  const base = JSON.stringify(days[0]?.meals ?? {})
  return days.every((d) => JSON.stringify(d.meals ?? {}) === base)
}

/** When every day was cloned (old builder), spread Fitrofy-style variety across the week. */
export function spreadWeeklyVariety(days: { day: number; meals: MealSlots; water_target: string; day_notes: string; plan_date?: string; skipped?: boolean }[]): typeof days {
  if (!isUniformMealWeek(days)) return days
  return days.map((d, i) => ({ ...d, meals: defaultMealsForDay(i) }))
}

export function findQuickPick(slot: keyof MealSlots, label: string, dayIndex?: number): QuickFoodPick | undefined {
  const picks = MEAL_SLOT_QUICK_FOODS[slot]
  const normalized = label.trim().toLowerCase()
  const byLabel = picks.find((p) => p.label.toLowerCase() === normalized)
  if (byLabel) return byLabel
  if (dayIndex != null) return pickForSlot(slot, dayIndex)
  return picks[0]
}
