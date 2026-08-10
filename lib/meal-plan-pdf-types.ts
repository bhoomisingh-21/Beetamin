import type { MealPlanDay, MealSlots } from '@/lib/meal-plan-types'

export type MealPlanPdfClientSummary = {
  name: string
  gender: string
  age: number | null
  weightKg: number | null
  heightCm: number | null
  heightLabel: string
  bmi: number | null
  bmr: number | null
  regionalPreference: string
  foodChoice: string
  lifestyle: string
}

export type MealPlanPdfDayMacros = {
  kcal: number
  protein: number
  fat: number
  carbs: number
  fiber: number
}

export type MealPlanPdfMealRow = {
  slotLabel: string
  description: string
}

export type MealPlanPdfDay = {
  dayNumber: number
  weekdayLabel: string
  planDate: string
  macros: MealPlanPdfDayMacros
  meals: MealPlanPdfMealRow[]
  skipped: boolean
}

export type MealPlanPdfPayload = {
  planId: string
  title: string
  client: MealPlanPdfClientSummary
  nutritionistName: string
  generatedDate: string
  targetCalories: number
  targetMacros: MealPlanPdfDayMacros
  days: MealPlanPdfDay[]
  instructions: string[]
  notes: string
}

export const PDF_MEAL_SLOT_LABELS: Record<keyof MealSlots, string> = {
  early_morning: 'When You Wake up',
  breakfast: 'Breakfast',
  mid_morning: 'Mid Day Meal',
  lunch: 'Lunch',
  evening_snack: 'Evening Snack',
  dinner: 'Dinner',
  bedtime: 'Before Sleep',
}

export const DEFAULT_MEAL_PLAN_INSTRUCTIONS = [
  'Drink 10–12 glasses of water daily.',
  'Daily 45 min walk or workout (5000 steps every day).',
  'Avoid maida, bakery products, junk foods, fried products, and packaged foods — focus on green leafy vegetables and home-made food.',
  'Reduce stress levels — 10 mins yoga or meditation daily.',
  'Take 6–7 hrs of sound sleep.',
  'Avoid spicy food; preferably use low-fat milk products.',
  'Add 1 tsp flaxseed powder in curd or raita.',
  '1 katori ≈ 100 gm · 1 bowl ≈ 200 gm · 1 cup ≈ 150 ml · 1 glass ≈ 200 ml',
]
