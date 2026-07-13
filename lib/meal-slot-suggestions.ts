import type { MealSlots } from '@/lib/meal-plan-types'
import { emptyDayTotals, type DayMacroTotals } from '@/lib/meal-plan-entry-types'

export type QuickFoodPick = {
  label: string
  ifctName?: string
  searchTerm: string
  defaultGrams: number
  kcalPer100g?: number
  carbsPer100g?: number
  proteinPer100g?: number
  fatPer100g?: number
}

/** Fitrofy-style: these rows stay the same all week. */
export const SAME_DAILY_SLOTS: (keyof MealSlots)[] = ['early_morning', 'bedtime']

function p(
  label: string,
  grams: number,
  kcal100: number,
  carbs = 0,
  protein = 0,
  fat = 0,
): QuickFoodPick {
  return {
    label,
    ifctName: label,
    searchTerm: label,
    defaultGrams: grams,
    kcalPer100g: kcal100,
    carbsPer100g: carbs,
    proteinPer100g: protein,
    fatPer100g: fat,
  }
}

export const MEAL_SLOT_QUICK_FOODS: Record<keyof MealSlots, QuickFoodPick[]> = {
  early_morning: [
    p('Jeera and saunf water', 200, 8, 1.2, 0.2, 0.1),
    p('Warm water + lemon', 200, 12, 2.5, 0.2, 0.1),
    p('Soaked almonds (5)', 30, 580, 18, 21, 50),
  ],
  breakfast: [
    p('Idli + sambar', 180, 118, 22, 4.5, 1.2),
    p('Vegetable Poha', 150, 128, 24, 3.2, 2.8),
    p('Methi Paratha', 80, 265, 32, 8.5, 11),
    p('Paneer Vegetable Sandwich', 120, 210, 24, 11, 8),
    p('Egg Omelette Sandwich', 130, 220, 18, 14, 10),
    p('Oats Vegetable Upma', 150, 135, 20, 4.5, 4),
    p('Dosa with sambar', 180, 125, 23, 4.2, 1.8),
  ],
  mid_morning: [
    p('Barley water', 200, 35, 7.5, 1, 0.3),
    p('Red Apple (medium)', 150, 52, 14, 0.3, 0.2),
    p('ABC juice', 200, 45, 10, 1.2, 0.2),
    p('Pineapple', 150, 50, 13, 0.5, 0.1),
    p('Green Smoothie', 250, 55, 11, 2, 1),
    p('Vegetable Juice', 250, 28, 5.5, 1.5, 0.3),
    p('Buttermilk', 200, 40, 4.5, 3.2, 1.2),
  ],
  lunch: [
    p('Dal + rice + sabzi', 250, 115, 20, 4, 2),
    p('Roti + paneer sabzi', 220, 175, 22, 9, 6.5),
    p('Khichdi + curd', 250, 110, 18, 5, 2.5),
    p('Brown rice + rajma', 250, 125, 21, 6, 1.8),
    p('Roti + dal + sabzi', 220, 120, 19, 5.5, 2.8),
    p('Jeera rice + raita', 250, 130, 24, 4, 2.5),
    p('Millet bowl + curd', 220, 105, 19, 4.5, 1.5),
  ],
  evening_snack: [
    p('Roasted makhana', 50, 350, 76, 8, 1.5),
    p('Sprouts chaat', 120, 95, 14, 7, 2),
    p('Green tea + biscuits', 80, 180, 28, 4, 6),
    p('Walnut (4 halves)', 30, 650, 12, 15, 63),
    p('Roasted Flax Seeds', 15, 530, 28, 18, 42),
    p('Fruit bowl', 150, 65, 16, 0.8, 0.3),
    p('Roasted chana', 50, 360, 58, 19, 6),
  ],
  dinner: [
    p('Roti + dal + vegetables', 220, 118, 18, 5.2, 2.6),
    p('Grilled chicken + salad', 200, 145, 3, 22, 5.5),
    p('Vegetable soup + toast', 250, 55, 9, 2.5, 1.2),
    p('Paneer tikka + roti', 220, 185, 18, 12, 8),
    p('Fish curry + rice', 250, 130, 16, 12, 3.5),
    p('Moong Dal Khichdi', 250, 105, 17, 5, 2),
    p('Stuffed paratha + curd', 200, 245, 30, 8, 10),
  ],
  bedtime: [
    p('Turmeric milk', 200, 65, 6, 3.5, 3),
    p('Soaked walnuts', 30, 650, 12, 15, 63),
    p('Warm milk + honey', 200, 75, 10, 3.8, 2.5),
  ],
}

export const MEAL_SLOT_SUGGESTIONS: Record<keyof MealSlots, string[]> = Object.fromEntries(
  Object.entries(MEAL_SLOT_QUICK_FOODS).map(([k, v]) => [k, v.map((item) => item.label)]),
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

export function isUniformMealWeek(days: { meals: MealSlots }[]): boolean {
  if (days.length < 2) return false
  const base = JSON.stringify(days[0]?.meals ?? {})
  return days.every((d) => JSON.stringify(d.meals ?? {}) === base)
}

export function spreadWeeklyVariety(
  days: {
    day: number
    meals: MealSlots
    water_target: string
    day_notes: string
    plan_date?: string
    skipped?: boolean
  }[],
): typeof days {
  if (!isUniformMealWeek(days)) return days
  return days.map((d, i) => ({ ...d, meals: defaultMealsForDay(i) }))
}

export function findQuickPick(
  slot: keyof MealSlots,
  label: string,
  dayIndex?: number,
): QuickFoodPick | undefined {
  const picks = MEAL_SLOT_QUICK_FOODS[slot]
  const normalized = label.trim().toLowerCase()
  const byLabel = picks.find((item) => item.label.toLowerCase() === normalized)
  if (byLabel) return byLabel
  const allPicks = Object.values(MEAL_SLOT_QUICK_FOODS).flat()
  const global = allPicks.find((item) => item.label.toLowerCase() === normalized)
  if (global) return global
  if (dayIndex != null) return pickForSlot(slot, dayIndex)
  return picks[0]
}

export function estimateServingKcal(pick: QuickFoodPick): number {
  if (!pick.kcalPer100g) return 0
  return Math.round((pick.kcalPer100g * pick.defaultGrams) / 100)
}

export function estimatePickMacros(pick: QuickFoodPick): DayMacroTotals {
  const ratio = pick.defaultGrams / 100
  return {
    kcal: (pick.kcalPer100g ?? 0) * ratio,
    carbs: (pick.carbsPer100g ?? 0) * ratio,
    protein: (pick.proteinPer100g ?? 0) * ratio,
    fat: (pick.fatPer100g ?? 0) * ratio,
  }
}

const MEAL_SLOTS_ORDER: (keyof MealSlots)[] = [
  'early_morning',
  'breakfast',
  'mid_morning',
  'lunch',
  'evening_snack',
  'dinner',
  'bedtime',
]

export function estimateDayTotalsFromMeals(meals: MealSlots, dayIndex: number): DayMacroTotals {
  return MEAL_SLOTS_ORDER.reduce((acc, slot) => {
    const label = meals[slot]?.trim()
    if (!label) return acc
    const pick = findQuickPick(slot, label, dayIndex)
    if (!pick?.kcalPer100g) return acc
    const m = estimatePickMacros(pick)
    return {
      kcal: acc.kcal + m.kcal,
      carbs: acc.carbs + m.carbs,
      protein: acc.protein + m.protein,
      fat: acc.fat + m.fat,
    }
  }, emptyDayTotals())
}
