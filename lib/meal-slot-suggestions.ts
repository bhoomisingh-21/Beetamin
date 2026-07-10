import type { MealSlots } from '@/lib/meal-plan-types'

export type QuickFoodPick = {
  label: string
  searchTerm: string
  defaultGrams: number
}

export const MEAL_SLOT_QUICK_FOODS: Record<keyof MealSlots, QuickFoodPick[]> = {
  early_morning: [
    { label: 'Warm water + lemon', searchTerm: 'lemon', defaultGrams: 50 },
    { label: 'Soaked almonds (5)', searchTerm: 'almond', defaultGrams: 30 },
    { label: 'Green tea', searchTerm: 'tea green', defaultGrams: 200 },
  ],
  breakfast: [
    { label: 'Oats with milk', searchTerm: 'oats', defaultGrams: 150 },
    { label: 'Idli + sambar', searchTerm: 'idli', defaultGrams: 120 },
    { label: 'Poha', searchTerm: 'poha', defaultGrams: 150 },
    { label: 'Upma', searchTerm: 'upma', defaultGrams: 150 },
    { label: 'Paratha + curd', searchTerm: 'paratha', defaultGrams: 100 },
  ],
  mid_morning: [
    { label: 'Seasonal fruit', searchTerm: 'apple', defaultGrams: 150 },
    { label: 'Buttermilk', searchTerm: 'buttermilk', defaultGrams: 200 },
    { label: 'Roasted chana', searchTerm: 'chickpea', defaultGrams: 50 },
  ],
  lunch: [
    { label: 'Dal + rice + sabzi', searchTerm: 'rice cooked', defaultGrams: 200 },
    { label: 'Roti + paneer sabzi', searchTerm: 'roti', defaultGrams: 120 },
    { label: 'Khichdi + curd', searchTerm: 'khichdi', defaultGrams: 200 },
    { label: 'Brown rice + rajma', searchTerm: 'rajma', defaultGrams: 200 },
  ],
  evening_snack: [
    { label: 'Green tea + biscuits', searchTerm: 'biscuit', defaultGrams: 40 },
    { label: 'Sprouts chaat', searchTerm: 'sprout', defaultGrams: 100 },
    { label: 'Roasted makhana', searchTerm: 'makhana', defaultGrams: 50 },
  ],
  dinner: [
    { label: 'Roti + dal + vegetables', searchTerm: 'roti', defaultGrams: 100 },
    { label: 'Grilled chicken + salad', searchTerm: 'chicken', defaultGrams: 120 },
    { label: 'Vegetable soup + toast', searchTerm: 'bread', defaultGrams: 80 },
  ],
  bedtime: [
    { label: 'Turmeric milk', searchTerm: 'milk', defaultGrams: 200 },
    { label: 'Soaked walnuts', searchTerm: 'walnut', defaultGrams: 30 },
    { label: 'Herbal tea', searchTerm: 'tea', defaultGrams: 200 },
  ],
}

export const MEAL_SLOT_SUGGESTIONS: Record<keyof MealSlots, string[]> = Object.fromEntries(
  Object.entries(MEAL_SLOT_QUICK_FOODS).map(([k, v]) => [k, v.map((p) => p.label)]),
) as Record<keyof MealSlots, string[]>

export function defaultMealLabelForSlot(slot: keyof MealSlots): string {
  return MEAL_SLOT_QUICK_FOODS[slot][0]?.label ?? ''
}

export function defaultMealSlots(): MealSlots {
  return {
    early_morning: defaultMealLabelForSlot('early_morning'),
    breakfast: defaultMealLabelForSlot('breakfast'),
    mid_morning: defaultMealLabelForSlot('mid_morning'),
    lunch: defaultMealLabelForSlot('lunch'),
    evening_snack: defaultMealLabelForSlot('evening_snack'),
    dinner: defaultMealLabelForSlot('dinner'),
    bedtime: defaultMealLabelForSlot('bedtime'),
  }
}

export function hydrateMealSlots(meals: Partial<MealSlots> | undefined): MealSlots {
  const defaults = defaultMealSlots()
  const src = meals ?? {}
  return {
    early_morning: src.early_morning?.trim() || defaults.early_morning,
    breakfast: src.breakfast?.trim() || defaults.breakfast,
    mid_morning: src.mid_morning?.trim() || defaults.mid_morning,
    lunch: src.lunch?.trim() || defaults.lunch,
    evening_snack: src.evening_snack?.trim() || defaults.evening_snack,
    dinner: src.dinner?.trim() || defaults.dinner,
    bedtime: src.bedtime?.trim() || defaults.bedtime,
  }
}
